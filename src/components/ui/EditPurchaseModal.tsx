// src/components/ui/EditPurchaseModal.tsx
import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";

type Props = {
  open: boolean;
  title?: string;
  defaultName?: string;
  defaultMarket?: string;
  onClose: () => void;
  onSave: (name: string, market: string) => Promise<void> | void;
};

const EditPurchaseModal: React.FC<Props> = ({
  open,
  title = "Editar compra",
  defaultName = "",
  defaultMarket = "",
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(defaultName);
  const [market, setMarket] = useState(defaultMarket);

  useEffect(() => {
    if (open) {
      setName(defaultName || "");
      setMarket(defaultMarket || "");
    }
  }, [open, defaultName, defaultMarket]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 grid place-items-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
          <Dialog.Title className="mb-3 text-lg font-semibold text-gray-900">
            {title}
          </Dialog.Title>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Ex.: Compra do mês"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mercado</label>
              <input
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Ex.: Hiper"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              className="rounded-xl bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="rounded-xl bg-yellow-500 px-4 py-2 font-medium text-black hover:brightness-95"
              onClick={async () => {
                const nm = (name || "").trim();
                const mk = (market || "").trim();
                await onSave(nm, mk);
                onClose();
              }}
            >
              Salvar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditPurchaseModal;
