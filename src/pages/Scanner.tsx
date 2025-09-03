// src/pages/Scanner.tsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "react-hot-toast";

import {
  parseNFCeWithMeta,
  sendParsedReceiptToApi,
  ReceiptItem,
  ParseWithMetaResult,
} from "@/services/nfceParser";

type ParsedState = {
  url?: string;
  itens: number;
  total: number;
  market?: string;
  dateISO?: string;
  items?: ReceiptItem[];
  meta?: ParseWithMetaResult["meta"];
};

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Aponte a câmera para o QR da NFC-e…");
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const [parsed, setParsed] = useState<ParsedState>({
    itens: 0,
    total: 0,
    items: [],
  });

  function normalizeQrText(text: string): string | null {
    try {
      import { findPreviewImage } from '@/services/clientImages';

      const withPreviews = await Promise.all(
        p.itens.map(async (it) => {
          const preview = await findPreviewImage(it.nome);
          return { ...it, preview };
        })
      );
      setParsed(prev => ({ ...prev, items: withPreviews }));
      
      const raw = decodeURIComponent(text.trim());
      if (/^https?:\/\//i.test(raw)) return raw;
      if (/^portal.*\.(sef|fazenda)\./i.test(raw)) return `https://${raw}`;
      return null;
    } catch {
      return null;
    }
  }

  async function handleQrRead(text: string) {
    const url = normalizeQrText(text);
    if (!url) {
      toast.error("Esse QR não parece ser de NFC-e.");
      return;
    }
    setReading(true);
    setStatus("Lendo a nota…");

    try {
      const { parsed: p, meta } = await parseNFCeWithMeta(url);

      const total =
        (p.grandTotal ?? 0) ||
        p.itens.reduce((s, it) => s + (it.total ?? it.preco * it.quantidade), 0);

      setParsed({
        url,
        itens: p.itens.length,
        total: Number(total.toFixed(2)),
        market: p.market ?? meta.storeName,
        dateISO: (p.date ?? new Date()).toISOString(),
        items: p.itens,
        meta,
      });

      setStatus("QR code lido");
      toast.success("NFC-e lida com sucesso!");
    } catch (e: any) {
      console.error(e);
      toast.error("Não consegui ler a nota (tente aproximar/iluminar).");
      setStatus("Falha ao ler. Toque em Reescanear.");
    } finally {
      setReading(false);
    }
  }

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;

    (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cam = devices.find((d) => d.kind === "videoinput");
        if (!cam) {
          setStatus("Nenhuma câmera encontrada.");
          return;
        }
        await codeReader.decodeFromVideoDevice(
          cam.deviceId,
          videoRef.current!,
          (result) => {
            if (!active || reading) return;
            if (result) {
              try { codeReader.reset(); } catch {}
              handleQrRead(result.getText());
            }
          }
        );
      } catch (err) {
        console.error(err);
        setStatus("Erro ao acessar a câmera.");
      }
    })();

    return () => {
      active = false;
      try { codeReader.reset(); } catch {}
    };
  }, [reading]);

  async function handleSalvar() {
    if (!parsed.meta || !parsed.items?.length) return;

    try {
      setSaving(true);
      await sendParsedReceiptToApi(parsed.meta, {
        name: "Compra (NFC-e)",
        market: parsed.market,
        date: parsed.dateISO ? new Date(parsed.dateISO) : undefined,
        itens: parsed.items,
        grandTotal: parsed.total,
      });
      toast.success("Compra salva!");
      // opcional: redirecionar para a lista/detalhe
      // navigate("/purchases"); // se você tiver react-router aqui
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao salvar compra.");
    } finally {
      setSaving(false);
    }
  }

  const itemsToShow = showAll ? parsed.items || [] : (parsed.items || []).slice(0, 10);
  const hidden = (parsed.items?.length || 0) - itemsToShow.length;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PageHeader title="Importar por QR Code" />
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mt-2 mb-3">
          <span className="text-sm text-green-700">{status}</span>
          <button className="border px-3 py-1 rounded text-sm" onClick={() => window.location.reload()}>
            Reescanear
          </button>
        </div>

        <video ref={videoRef} className="border w-full rounded mb-4" muted playsInline />

        {/* cards de resumo */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">Itens</div>
            <div className="text-xl font-semibold">{parsed.itens}</div>
          </div>
          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-xl font-semibold">
              {parsed.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Itens lidos</span>
            <span className="text-sm">{parsed.itens}</span>
          </div>

          {/* lista de itens (nome limpo + total por linha) */}
          <div className="max-h-64 overflow-auto divide-y">
            {itemsToShow.map((it, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <div className="pr-3">
                  <div className="text-sm font-medium">{it.nome}</div>
                  <div className="text-xs text-gray-500">
                    {it.quantidade} {it.unidade ? it.unidade : "un"}{it.peso ? ` · peso: ${it.peso}` : ""}
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {(it.total ?? it.preco * it.quantidade).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </div>
            ))}
            {hidden > 0 && !showAll && (
              <button className="w-full py-2 text-amber-600 text-sm" onClick={() => setShowAll(true)}>
                … ver mais {hidden} itens
              </button>
            )}
          </div>
        </div>

        <label className="block text-sm text-gray-600 mb-1">Mercado</label>
        <input
          className="border rounded w-full p-3 mb-3"
          placeholder="Ex.: Carrefour"
          defaultValue={parsed.market || ""}
        />

        <label className="block text-sm text-gray-600 mb-1">Nome da compra</label>
        <input className="border rounded w-full p-3 mb-3" defaultValue="Compra (NFC-e)" />

        <label className="block text-sm text-gray-600 mb-1">Data da compra</label>
        <input type="date" className="border rounded w-full p-3 mb-4" defaultValue={parsed.dateISO?.slice(0, 10)} />

        <button
          className="w-full bg-yellow-500 text-black rounded py-3 font-semibold disabled:opacity-50"
          disabled={!parsed.meta || !parsed.items?.length || saving}
          onClick={handleSalvar}
        >
          {saving ? "Salvando…" : "Salvar compra"}
        </button>
      </div>

      <BottomNav activeTab="scanner" />
    </div>
  );
}
