// src/components/ui/InstallHowToModal.tsx
import React from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** iPhone: corpo com cantos arredondados + notch */
const IconIOS: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} text-yellow-600`}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="5.5" y="2.5" width="13" height="19" rx="3.2" />
    <rect x="9" y="3.4" width="6" height="1.7" rx="0.8" />
    <circle cx="12" cy="19.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

/** Android: retângulo sem notch + barra inferior */
const IconAndroid: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} text-yellow-600`}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="4.8" y="2.8" width="14.4" height="18.4" rx="3.8" />
    <rect x="10.2" y="19.4" width="3.6" height="1" rx="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; bullets: React.ReactNode }> = ({
  icon,
  title,
  bullets,
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4">
    <div className="mb-2 flex items-center gap-3">
      {icon}
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
    <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">{bullets}</ol>
  </div>
);

const InstallHowToModal: React.FC<Props> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 grid place-items-center p-4">
        <Dialog.Panel className="w-full max-w-md mx-4 rounded-2xl bg-white p-5 shadow-lg max-h-[85vh] overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Como instalar o Comparafy
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Fechar"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3">
            <Section
              icon={<IconIOS className="h-5 w-5" />}
              title="iPhone / iPad (Safari)"
              bullets={
                <>
                  <li>Toque em <b>Compartilhar</b> (quadrado com seta).</li>
                  <li>Escolha <b>Adicionar à Tela de Início</b>.</li>
                  <li>Confirme o nome e toque em <b>Adicionar</b>.</li>
                </>
              }
            />

            <Section
              icon={<IconAndroid className="h-5 w-5" />}
              title="Android (Chrome / Edge / Brave)"
              bullets={
                <>
                  <li>Procure o ícone <b>Instalar</b> na barra do navegador.</li>
                  <li>Ou abra o menu ⋮ → <b>Instalar aplicativo</b>.</li>
                </>
              }
            />

            <Section
              icon={<ComputerDesktopIcon className="h-5 w-5 text-yellow-600" />}
              title="Desktop (Chrome / Edge)"
              bullets={
                <>
                  <li>Clique no ícone de <b>Instalar</b> na barra de endereço.</li>
                  <li>Ou menu: ≡ → <b>Instalar “Comparafy”</b>.</li>
                </>
              }
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default InstallHowToModal;