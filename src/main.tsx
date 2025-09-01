import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { DataProvider } from "./context/DataContext";
import "./index.css";

// 🔸 GARANTE que o categorizador esteja pronto antes de montar a árvore
import { initCategorizer } from "@/assets/catalog-data/initCategorizer";

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  const host = location.host;
  const isStackBlitz = host.includes('stackblitz') || host.includes('webcontainer.io');
  if (isStackBlitz) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(r => r.unregister()))
      .catch(() => {});
  }
}

initCategorizer().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter>
        <DataProvider>
          <App />
        </DataProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
});
