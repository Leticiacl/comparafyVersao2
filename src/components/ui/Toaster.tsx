// src/components/ui/Toaster.tsx
import React from "react";
import { Toaster, toast } from "sonner";

// Exporta uma função de atalho para telas que chamam showToast
export function showToast(
  message: string,
  type: "success" | "error" | "info" = "info"
) {
  if (type === "success") return toast.success(message);
  if (type === "error") return toast.error(message);
  return toast(message);
}

// Host global do toaster (adicione em App)
const AppToaster: React.FC = () => (
  <Toaster position="top-center" richColors closeButton />
);

export default AppToaster;
