// src/utils/export.ts
type AnyPurchase = {
  id?: string;
  name?: string;
  market?: string;
  total?: number;
  createdAt?: any;
  itens?: Array<{
    nome?: string;
    quantidade?: number;
    unidade?: string;
    peso?: number;
    preco?: number;
    total?: number;
  }>;
};

const toDate = (v: any): Date => {
  if (v instanceof Date) return v;
  if (v?.seconds) return new Date(v.seconds * 1000);
  if (typeof v === "number") return new Date(v);
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
};

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const br = (s: string) => (s ?? "").replace(/\r?\n/g, " ").replace(/"/g, '""');

function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportPurchasesJSON(purchases: AnyPurchase[]) {
  const safe = JSON.stringify(purchases ?? [], null, 2);
  const blob = new Blob([safe], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `comparafy-purchases-${Date.now()}.json`);
}

export function exportPurchasesCSV(purchases: AnyPurchase[]) {
  // Cabeçalho
  const lines = [
    [
      "purchase_id",
      "data",
      "compra",
      "mercado",
      "total_compra",
      "item",
      "quantidade",
      "unidade",
      "peso",
      "preco_unitario",
      "total_item",
    ].join(","),
  ];

  for (const p of purchases ?? []) {
    const d = toDate(p.createdAt);
    const data = toISODate(d);
    const compra = br(p.name || "");
    const mercado = br(p.market || "");
    const totalCompra = Number(p.total || 0).toFixed(2);

    for (const it of p.itens || []) {
      const nome = br(it?.nome || "");
      const qtd = Number(it?.quantidade || 0);
      const unidade = br(it?.unidade || "");
      const peso = it?.peso != null ? String(it.peso) : "";
      const preco = Number(it?.preco || 0).toFixed(2);
      const totalItem = (typeof it?.total === "number" && it.total) || (Number(it?.preco) || 0) * (Number(it?.quantidade) || 1) || 0;
      const total = Number(totalItem).toFixed(2);

      lines.push(
        [
          `"${br(p.id || "")}"`,
          data,
          `"${compra}"`,
          `"${mercado}"`,
          totalCompra,
          `"${nome}"`,
          String(qtd),
          `"${unidade}"`,
          peso,
          preco,
          total,
        ].join(",")
      );
    }
  }

  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `comparafy-purchases-${Date.now()}.csv`);
}
