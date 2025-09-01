import React from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  open: boolean;
  onClose: () => void;
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    <div className="space-y-2 text-gray-700 text-sm">{children}</div>
  </section>
);

const TermsModal: React.FC<Props> = ({ open, onClose }) => {
  const UPDATED_AT = new Date().toLocaleDateString("pt-BR");
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 grid place-items-center p-4">
        <Dialog.Panel className="w-full max-w-2xl mx-4 rounded-2xl bg-white p-5 shadow-lg max-h-[85vh] overflow-hidden flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900">Termos de uso</Dialog.Title>
            <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Fechar">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-3 text-xs text-gray-500">Última atualização: {UPDATED_AT}</div>

          <div className="space-y-4 overflow-y-auto pr-1">
            <Section title="1. Introdução">
              <p>
                Bem-vindo ao <strong>Comparafy</strong>. Estes Termos regem o uso do aplicativo. Ao utilizar o Comparafy,
                você concorda com as condições abaixo.
              </p>
            </Section>

            <Section title="2. Privacidade">
              <p>
                Tratamos seus dados conforme a LGPD. Coletamos apenas o necessário para listas, compras e comparações.
              </p>
            </Section>

            <Section title="3. Limitações">
              <ul className="list-disc pl-5 space-y-1">
                <li>Preços podem variar por data, região e promoções.</li>
                <li>Dependemos de serviços de terceiros (ex.: SEFAZ) para certas funções.</li>
              </ul>
            </Section>

            <Section title="4. Encerramento">
              <p>Você pode excluir sua conta a qualquer momento pelo app.</p>
            </Section>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default TermsModal;
