// src/pages/PurchasesReceipt.tsx
import React, { useEffect, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/ui/PageHeader";
import { useData } from "@/context/DataContext";
import { parseNFCeFromUrl, ReceiptParseResult } from "@/services/nfceParser";
import { anyToISODate, toISO } from "@/utils/date";
import { formatBRL } from "@/utils/price";
import { categorize } from "@/utils/category";

/* ------- extrai a URL do QR ------- */
function extractUrl(payload: unknown): string | null {
  const raw =
    typeof payload === "string"
      ? payload
      : Array.isArray(payload) && (payload[0] as any)?.rawValue
      ? String((payload[0] as any).rawValue)
      : (payload as any)?.rawValue ?? String((payload as any)?.[0] ?? "");
  const m = String(raw).match(/https?:\/\/[^\s<>"')]+/i);
  return m ? m[0].replace(/[)\]}>.,;]*$/, "") : null;
}

export default function PurchasesReceipt() {
  const nav = useNavigate();

  // ✅ lê o contexto e tolera diferenças de nomes entre versões
  const dataCtx = useData() as any;
  const createFromReceipt =
    dataCtx?.createPurchaseFromReceiptInContext || dataCtx?.createPurchaseInContext;

  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ReceiptParseResult | null>(null);
  const [market, setMarket] = useState("");
  const [listName, setListName] = useState("");
  const [dateISO, setDateISO] = useState<string>(toISO(new Date()));
  const [showAll, setShowAll] = useState(false);

  const lastScan = useRef(0);

  const handleScan = async (detected: any) => {
    const now = Date.now();
    if (now - lastScan.current < 1500) return;
    lastScan.current = now;

    const url = extractUrl(detected);
    if (!url) return;

    setScanning(false);
    setLoading(true);
    try {
      const data = await parseNFCeFromUrl(url);

      setParsed(data);
      setMarket((data as any)?.market || "");
      setListName((data as any)?.name || "");

      const iso = anyToISODate((data as any)?.date) || toISO(new Date());
      setDateISO(iso);

      const n = (data as any)?.totalItems ?? (data as any)?.itens?.length ?? 0;
      toast.success(n ? `QR lido! ${n} item(ns) detectado(s).` : "QR lido!");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao processar a NFC-e.");
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    if (!createFromReceipt) {
      console.warn("Função de criação não disponível no contexto: verifique DataContext.");
      toast.error("Não foi possível salvar: ação indisponível.");
      return;
    }

    setLoading(true);
    try {
      const dateObj = dateISO ? new Date(`${dateISO}T00:00:00`) : new Date();
      const itens = ((parsed as any)?.itens || []).map((it: any) => ({
        ...it,
        categoria: it?.categoria || categorize(it?.nome || ""),
      }));

      await createFromReceipt({
        name: listName || "Compra (NFC-e)",
        market: market || "—",
        date: dateObj,
        itens,
        source: "receipt", // ✅ rastreabilidade
      });

      toast.success("Compra importada!");
      nav("/purchases");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao salvar a compra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => setScanning(true), []);

  const previewCount = (parsed as any)?.totalItems ?? (parsed as any)?.itens?.length ?? 0;
  const computedTotal =
    (parsed as any)?.grandTotal ??
    +(((parsed as any)?.itens ?? []).reduce((acc: number, it: any) => {
      const totalLinha =
        (typeof it.total === "number" && it.total) ||
        (Number(it.preco) || 0) * (Number(it.quantidade) || 1);
      return acc + totalLinha;
    }, 0) || 0).toFixed(2);

  return (
    <div className="mx-auto max-w-xl bg-white p-4 pb-32">
      <PageHeader title="Importar por QR Code" />

      {scanning ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
          <Scanner
            onScan={handleScan}
            onError={(err) => {
              console.error(err);
              toast.error("Erro ao acessar a câmera.");
            }}
            components={{ audio: true, torch: false, zoom: false, finder: false }}
            constraints={{ facingMode: "environment" }}
            styles={{ container: { width: "100%", height: 320 } }}
          />
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
          <div className="text-sm text-gray-700">✅ QR code lido</div>
          <button
            onClick={() => {
              setParsed(null);
              setMarket("");
              setListName("");
              setShowAll(false);
              setScanning(true);
            }}
            className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm text-gray-800 active:scale-95"
          >
            Reescanear
          </button>
        </div>
      )}

      {parsed && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Itens</div>
            <div className="text-lg font-semibold text-gray-900">{previewCount}</div>
          </div>
          <div className="rounded-xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-semibold text-gray-900">{formatBRL(computedTotal)}</div>
          </div>
        </div>
      )}

      {parsed && (
        <>
          <div className="mt-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between border-b bg-gray-50 p-3 text-sm">
              <div className="font-medium text-gray-800">Itens lidos</div>
              <div className="text-gray-600">{previewCount}</div>
            </div>
            <ul className="max-h-[360px] overflow-auto p-3 text-sm text-gray-800">
              {((parsed as any).itens ?? [])
                .slice(0, showAll ? undefined : 10)
                .map((it: any, i: number) => (
                  <li key={i} className="flex items-center justify-between py-1.5">
                    <span className="pr-3">{it.nome}</span>
                    <span className="font-medium">
                      {formatBRL(typeof it.total === "number" ? it.total : it.preco)}
                    </span>
                  </li>
                ))}
              {(parsed as any).itens?.length > 10 && !showAll && (
                <li className="pt-2 text-center">
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-xs font-medium text-yellow-600 underline"
                  >
                    … ver mais {(parsed as any).itens.length - 10} itens
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Itens a revisar (sem unidade ou com preço 0) */}
          {(((parsed as any).itens ?? []).some((it: any) => !it.unidade || !(it.preco || it.total))) && (
            <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50">
              <div className="border-b border-amber-200 p-3 text-sm font-medium text-amber-900">
                Itens a revisar
              </div>
              <ul className="max-h-[240px] overflow-auto p-3 text-sm text-amber-900">
                {((parsed as any).itens ?? [])
                  .filter((it: any) => !it.unidade || !(it.preco || it.total))
                  .map((it: any, i: number) => (
                    <li key={i} className="flex items-center justify-between py-1.5">
                      <span className="pr-3">{it.nome}</span>
                      <span className="text-xs">
                        {!it.unidade ? "sem unidade" : ""}
                        {!it.unidade && !(it.preco || it.total) ? " · " : ""}
                        {!(it.preco || it.total) ? "preço ausente" : ""}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}

      {parsed && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Mercado</label>
            <input
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              placeholder="Ex.: Carrefour"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Nome da compra</label>
            <input
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Ex.: Compra do mês"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Data da compra</label>
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-yellow-400"
            />
            <p className="mt-1 text-xs text-gray-500">Se preferir, altere a data.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Salvar compra"}
          </button>
        </div>
      )}

      <BottomNav activeTab="purchases" />
    </div>
  );
}
