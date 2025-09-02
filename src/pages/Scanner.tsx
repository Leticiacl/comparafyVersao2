// src/pages/Scanner.tsx
import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import BottomNav from "../components/BottomNav";
import PageHeader from "../components/ui/PageHeader";
import { parseNFCeFromUrl, sendParsedReceiptToApi, type ReceiptMeta } from "@/services/nfceParser";
import { toast } from "react-hot-toast";

const ScannerPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Inicializando câmera...");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;

    (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInput = devices.find((d) => d.kind === "videoinput");
        if (!videoInput) {
          setStatus("Nenhuma câmera encontrada.");
          return;
        }
        await codeReader.decodeFromVideoDevice(
          videoInput.deviceId,
          videoRef.current!,
          (result) => {
            if (!active) return;
            if (result) {
              const text = result.getText();
              setUrl(text);
              setStatus(`QR lido: ${text}`);
              codeReader.reset(); // para o scanner após leitura
            }
          }
        );
        setStatus("Aponte a câmera para o QR da NFC-e.");
      } catch {
        setStatus("Erro ao acessar a câmera.");
      }
    })();

    return () => {
      active = false;
      try { codeReader.reset(); } catch {}
    };
  }, []);

  async function handleSalvar() {
    try {
      if (!url.trim()) {
        toast.error("Cole ou escaneie a URL da NFC-e.");
        return;
      }
      toast.loading("Lendo NFC-e...", { id: "nfce" });

      // 1) parseia e extrai metadados
      const { parsed, meta: auto } = await parseNFCeFromUrl(url);

      // 2) valida e monta meta final (com fallbacks simples)
      const accessKey = auto.accessKey;
      if (!accessKey || accessKey.length !== 44) {
        toast.dismiss("nfce");
        toast.error("Não consegui encontrar a chave de acesso (44 dígitos).");
        return;
      }

      const meta: ReceiptMeta = {
        accessKey,
        issuedAtISO: auto.issuedAtISO ?? new Date().toISOString(),
        uf: auto.uf ?? "MG",
        storeName: auto.storeName ?? parsed.market ?? "Loja",
        cnpj: auto.cnpj,
        cityName: auto.cityName,
        grandTotal: auto.grandTotal ?? parsed.grandTotal,
      };

      // 3) envia para a API
      await sendParsedReceiptToApi(meta, parsed);

      toast.success("Nota enviada com sucesso!", { id: "nfce" });
    } catch (err) {
      console.error(err);
      toast.dismiss("nfce");
      toast.error("Erro ao salvar nota.");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PageHeader title="Scanner" />
      <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full">
        <h2 className="text-lg font-semibold mb-3">Importar NFC-e</h2>

        <label className="block mb-2 text-sm text-gray-600">URL da NFC-e</label>
        <input
          type="text"
          placeholder="Cole a URL da NFC-e aqui"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <button
          onClick={handleSalvar}
          className="mt-4 bg-yellow-500 px-4 py-2 rounded text-black"
        >
          Salvar
        </button>

        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-2">{status}</p>
          <video ref={videoRef} className="border w-full rounded" muted playsInline />
        </div>
      </main>
      <BottomNav activeTab="scanner" />
    </div>
  );
};

export default ScannerPage;
