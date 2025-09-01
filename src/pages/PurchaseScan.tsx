import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useData } from "../context/DataContext";
import PageHeader from "../components/ui/PageHeader";

/**
 * Tela preparada para integrar seu componente de QRCode.
 * Enquanto não pluga o scanner real, deixei um campo de teste
 * para colar a URL do cupom e criar a compra.
 */
export default function PurchaseScan() {
  const nav = useNavigate();
  const { createPurchaseFromReceiptInContext } = useData();
  const [market, setMarket] = useState("");
  const [debugUrl, setDebugUrl] = useState("");

  const handleCreate = async () => {
    // TODO: parsear "debugUrl" para itens reais.
    // Por enquanto, cria uma compra vazia com mercado preenchido
    const id = await createPurchaseFromReceiptInContext({
      market: market || "Cupom fiscal",
      itens: [],
    });
    if (id) nav(`/purchases/${id}`);
    else nav("/purchases");
  };

  return (
    <div className="p-4 pb-28 max-w-xl mx-auto">
      <PageHeader title="Scanner" />

      {/* Aqui você pode renderizar o seu <Scanner /> real */}
      <div className="mt-6 p-4 border rounded-xl">
        <p className="text-sm text-gray-600">
          Integre aqui o leitor de QR Code. Por enquanto, use o modo de teste abaixo.
        </p>
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">Mercado (opcional)</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Ex.: Carrefour"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">URL/Texto do QR (teste)</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Cole aqui a URL do QR para testes"
            value={debugUrl}
            onChange={(e) => setDebugUrl(e.target.value)}
          />
        </div>
        <button
          onClick={handleCreate}
          className="mt-4 w-full bg-yellow-500 text-black py-3 rounded-xl font-medium shadow"
        >
          Criar compra de teste
        </button>
      </div>

      <BottomNav activeTab="purchases" />
    </div>
  );
}