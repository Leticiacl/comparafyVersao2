import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { DataProvider } from "./context/DataContext";
import "./index.css";

// 🔸 GARANTE que o categorizador esteja pronto antes de montar a árvore
import { initCategorizer } from "@/assets/catalog-data/initCategorizer";

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
