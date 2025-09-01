import React from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/ui/PageHeader";

const PurchaseNew: React.FC = () => {
  return (
    <main className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl bg-white px-4 md:px-6 pt-safe pb-[88px]">
      <PageHeader title="Nova compra" />

      <div className="mt-6 space-y-4">
        <Link
          to="/purchases/receipt"
          className="block rounded-2xl border border-gray-200 bg-white p-4 transition active:scale-[.995]"
        >
          <div className="font-semibold text-gray-900">Via QR Code (NFC-e)</div>
          <div className="text-sm text-gray-500">
            Escaneie o QR da nota fiscal e importe os itens.
          </div>
        </Link>

        <Link
          to="/purchases/from-list"
          className="block rounded-2xl border border-gray-200 bg-white p-4 transition active:scale-[.995]"
        >
          <div className="font-semibold text-gray-900">A partir de uma lista</div>
          <div className="text-sm text-gray-500">
            Selecione sua lista, escolha os itens e salve a compra.
          </div>
        </Link>
      </div>

      <BottomNav activeTab="purchases" />
    </main>
  );
};

export default PurchaseNew;
