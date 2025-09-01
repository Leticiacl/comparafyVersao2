// src/pages/Register.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/** Mantido apenas para compatibilidade de rotas.
 *  Redireciona permanentemente para /signup.
 */
export default function RegisterRedirect() {
  const nav = useNavigate();
  useEffect(() => {
    nav("/signup", { replace: true });
  }, [nav]);
  return null;
}
