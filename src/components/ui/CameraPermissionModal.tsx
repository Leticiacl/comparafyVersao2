import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import {
  CameraIcon,
  QrCodeIcon,
  XMarkIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

type Props = {
  open: boolean;
  onClose: () => void;
  // Recebe o stream ao conceder permissão (para você iniciar o reader do QR)
  onGranted: (stream: MediaStream) => void;
};

const CameraPermissionModal: React.FC<Props> = ({ open, onClose, onGranted }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const request = async () => {
    setErr(null);
    setLoading(true);

    // dica UX: preferir câmera traseira quando existir
    const constraints: MediaStreamConstraints = {
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    };

    try {
      // Em alguns navegadores dá para sondar o status antes (não quebra se não houver)
      try {
        // @ts-ignore
        const status = await navigator.permissions?.query({ name: "camera" as PermissionName });
        if (status && status.state === "denied") {
          throw new Error("Acesso negado. Habilite a câmera nas permissões do navegador.");
        }
      } catch {
        /* segue o fluxo normal */
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      onGranted(stream);
      onClose();
    } catch (e: any) {
      const name = e?.name || "";
      const msg =
        name === "NotAllowedError"
          ? "Você negou o acesso à câmera. Toque na barra de endereço (cadeado/ícone da câmera) e permita o uso."
          : name === "NotFoundError"
          ? "Nenhuma câmera foi encontrada neste dispositivo."
          : window.isSecureContext === false
          ? "Para usar a câmera é necessário HTTPS (ou localhost em desenvolvimento)."
          : "Não foi possível acessar a câmera. Verifique as permissões do navegador.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* fundo com desfoque */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 grid place-items-center p-4">
        {/* mesmo tamanho dos seus modais compactos */}
        <Dialog.Panel className="w-full max-w-md mx-4 rounded-2xl bg-white p-5 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Usar a câmera para ler QR code
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Fechar"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-3 rounded-xl border border-gray-200 p-4">
            <div className="mb-2 flex items-center gap-2">
              <CameraIcon className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-gray-900">Por que pedimos a câmera?</span>
            </div>
            <ul className="ml-6 list-disc text-sm text-gray-700">
              <li>Somente para ler o QR code.</li>
              <li>Não guardamos fotos nem vídeos do seu aparelho.</li>
              <li>Você pode desativar a permissão quando quiser.</li>
            </ul>
          </div>

          {err && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <InformationCircleIcon className="mt-0.5 h-5 w-5" />
              <div>{err}</div>
            </div>
          )}

          {/* Dicas rápidas */}
          <details className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <summary className="cursor-pointer select-none font-medium text-gray-900">
              Problemas para permitir?
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <b>iPhone (Safari):</b> Ajustes &gt; Safari &gt; Câmera &gt; Permitir, ou toque no
                ícone de “aA/Privacidade” na barra e habilite a câmera.
              </div>
              <div>
                <b>Android (Chrome/Edge):</b> Cadeado/ícone de câmera na barra &gt; Permissões &gt;
                Câmera &gt; Permitir.
              </div>
              <div>
                <b>Desktop:</b> Clique no cadeado/ícone de câmera ao lado do endereço e permita.
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={request}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:brightness-95 disabled:opacity-60"
              disabled={loading}
            >
              <QrCodeIcon className="h-4 w-4" />
              {loading ? "Abrindo câmera..." : "Permitir câmera"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CameraPermissionModal;