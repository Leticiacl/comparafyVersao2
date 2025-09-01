import React from "react";

/**
 * InstallButton
 * - Mostra "Instalar app" quando houver beforeinstallprompt
 * - Caso contrário, abre um guia "Como instalar"
 */
const InstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [openGuide, setOpenGuide] = React.useState(false);

  React.useEffect(() => {
    const onBeforeInstall = (e: Event & { prompt?: () => void; userChoice?: Promise<any> }) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => setDeferredPrompt(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall as any, { passive: false });
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall as any);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canInstall = !!deferredPrompt;

  const onClick = async () => {
    if (deferredPrompt?.prompt) {
      deferredPrompt.prompt();
      try {
        await deferredPrompt.userChoice;
      } catch {}
      setDeferredPrompt(null); // evento só pode ser usado 1x
    } else {
      setOpenGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left hover:bg-gray-50"
        aria-haspopup="dialog"
        aria-expanded={openGuide}
      >
        <div className="flex items-center justify-between">
          <div className="font-medium text-gray-900">Instalar aplicativo</div>
          <div className="text-sm text-gray-600">{canInstall ? "Instalar" : "Como instalar"}</div>
        </div>
        <div className="mt-1 text-sm text-gray-500">
          Adicione o Comparafy à tela inicial para uma experiência melhor.
        </div>
      </button>

      {openGuide && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpenGuide(false)} />
          <div className="absolute inset-x-4 top-16 rounded-2xl bg-white p-4 shadow-lg md:mx-auto md:max-w-lg">
            <div className="mb-2 text-lg font-semibold">Como instalar o Comparafy</div>

            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <div className="font-semibold">iPhone/iPad (Safari)</div>
                <ol className="list-decimal pl-5">
                  <li>Toque no botão <b>Compartilhar</b> (quadrado com seta).</li>
                  <li>Escolha <b>Adicionar à Tela de Início</b>.</li>
                  <li>Confirme o nome e toque em <b>Adicionar</b>.</li>
                </ol>
              </div>

              <div>
                <div className="font-semibold">Android (Chrome/Edge/Brave)</div>
                <ol className="list-decimal pl-5">
                  <li>Procure pelo ícone ou opção <b>Instalar</b> na barra de endereço.</li>
                  <li>Ou menu ⋮ → <b>Instalar aplicativo</b>.</li>
                </ol>
              </div>

              <div>
                <div className="font-semibold">Desktop (Chrome/Edge)</div>
                <ol className="list-decimal pl-5">
                  <li>Clique no ícone de <b>Instalar</b> na barra de endereço.</li>
                  <li>Ou menu → <b>Instalar “Comparafy”</b>.</li>
                </ol>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpenGuide(false)}
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallButton;
