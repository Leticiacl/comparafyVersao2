// src/components/ui/ConfirmDialog.tsx
import React from "react";

type Props = {
  open: boolean;
  title: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onClose,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-[201] w-[90%] max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-500/90"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
