// src/pages/Scanner.tsx
import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import BottomNav from '../components/BottomNav';
import PageHeader from "../components/ui/PageHeader";

const Scanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Inicializando câmera...');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;

    navigator.mediaDevices
      .enumerateDevices()
      .then(devices => {
        const videoInput = devices.find(d => d.kind === 'videoinput');
        if (!videoInput) {
          setStatus('Nenhuma câmera encontrada.');
          return;
        }
        return codeReader.decodeFromVideoDevice(
          videoInput.deviceId,
          videoRef.current!,
          (result, error) => {
            if (!active) return;
            if (result) {
              setStatus(`QR lido: ${result.getText()}`);
              codeReader.reset(); // pára o scanner
            }
          }
        );
      })
      .catch(() => setStatus('Erro ao acessar a câmera.'));

    return () => {
      active = false;
      try { codeReader.reset(); } catch {}
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PageHeader title="Scanner" />
      <div className="flex-1 px-4 flex flex-col items-center justify-center text-gray-500">
        <video ref={videoRef} className="border w-full max-w-md mb-4" muted playsInline />
        <p>{status}</p>
      </div>
      <BottomNav activeTab="scanner" />
    </div>
  );
};

export default Scanner;