// src/components/ui/NewListModal.tsx
import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** compat: pode usar onCreated OU onCreate */
  onCreated?: (name: string) => void | Promise<any>;
  onCreate?: (name: string) => void | Promise<any>;
};

export default function NewListModal({
  isOpen,
  onClose,
  onCreated,
  onCreate,
}: Props) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // trava o scroll quando abrir
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // limpa e foca
    setName("");
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const canCreate = name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    const cb = onCreated ?? onCreate;
    if (cb) await cb(name.trim());
    // não fecho aqui porque o fluxo atual fecha no pai (handleCreateList)
    // se quiser que feche aqui também, descomente:
    // onClose();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[120] flex items-center justify-center transition",
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!isOpen}
    >
      {/* overlay com blur leve, cobrindo inclusive a bottom bar */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-[121] w-[92%] max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 className="text-xl font-semibold text-slate-900">Nova Lista</h2>

        <label className="mt-4 mb-1 block text-sm text-slate-700">
          Nome da lista
        </label>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Mensal"
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-yellow-400"
        />

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canCreate}
            className={clsx(
              "rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-500/90",
              !canCreate && "opacity-60"
            )}
          >
            Criar
          </button>
        </div>
      </form>
    </div>
  );
}
