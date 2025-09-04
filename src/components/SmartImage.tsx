// src/components/SmartImage.tsx
import React, { useMemo, useState, useEffect } from "react";

type Candidate = string | undefined | null;

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export default function SmartImage({
  name,
  brand,
  code, // EAN/GTIN (se tiver)
  size = 128,
  className = "rounded-md bg-slate-100 object-contain",
  explicitUrls = [],
  alt,
}: {
  name: string;
  brand?: string;
  code?: string;
  size?: number;
  className?: string;
  explicitUrls?: Candidate[];
  alt?: string;
}) {
  const [idx, setIdx] = useState(0);

  const candidates = useMemo(() => {
    const q = (s: string) => encodeURIComponent(slug(s));

    // heurísticas de busca (mais assertivas que um termo solto)
    const nameQ = q(name);
    const brandQ = brand ? q(brand) : "";

    const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

    const base: Candidate[] = [
      // 1) Thumbs públicas no Firebase Storage, se você subir com nomes previsíveis
      storageBucket ? `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/catalog%2F${nameQ}.jpg?alt=media` : undefined,
      storageBucket ? `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/catalog%2F${nameQ}.png?alt=media` : undefined,

      // 2) Open Food Facts por EAN (se disponível)
      code && code.length >= 8
        ? `https://images.openfoodfacts.org/images/products/${code.replace(/(\d{3})(\d{3})/, "$1/$2/")}.front.200.jpg`
        : undefined,

      // 3) Unsplash source — só funciona como <img src>, não use fetch!
      `https://source.unsplash.com/featured/${size}x${size}?${encodeURIComponent(`${brand ?? ""} ${name}`)}`,
      `https://source.unsplash.com/featured/${size}x${size}?${encodeURIComponent(name)}`,

      // 4) Placeholder
      `https://placehold.co/${size}x${size}?text=${encodeURIComponent((name ?? "").slice(0, 12))}`,
    ];

    return [...(explicitUrls.filter(Boolean) as string[]), ...base].filter(Boolean);
  }, [name, brand, code, size, explicitUrls]);

  useEffect(() => setIdx(0), [name, brand, code, size]);

  const src = candidates[idx] || candidates[candidates.length - 1];

  return (
    <img
      src={src}
      alt={alt ?? name}
      width={size}
      height={size}
      className={className}
      onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
