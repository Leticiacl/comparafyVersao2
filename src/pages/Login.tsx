// src/pages/Login.tsx
import React, { useEffect, useState } from "react";
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth, googleProvider } from "@/services/firebase";

const logoUrl = import.meta.env.BASE_URL + "COMPARAFY.png";

const GoogleIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.61l6.9-6.9C36.66 2.49 30.73 0 24 0 14.62 0 6.39 5.38 2.56 13.22l8.08 6.26C12.3 14.3 17.65 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24c0-1.57-.14-3.08-.41-4.5H24v9h12.65c-.55 2.96-2.23 5.47-4.74 7.17l7.24 5.62C43.82 37.83 46.5 31.4 46.5 24z"/>
    <path fill="#FBBC05" d="M10.64 28.52c-.48-1.43-.75-2.95-.75-4.52s.27-3.09.75-4.52l-8.08-6.26C.93 16.05 0 19.91 0 24s.93 7.95 2.56 10.78l8.08-6.26z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.83l-7.24-5.62c-2.01 1.35-4.59 2.15-8.66 2.15-6.35 0-11.74-4.28-13.67-10.18l-8.08 6.26C6.39 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

function friendlyError(code?: string) {
  switch (code) {
    case "auth/operation-not-allowed":
      return "Modo de login não habilitado no Firebase (verifique o Console).";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-mail ou senha inválidos.";
    case "auth/user-not-found":
      return "Não encontramos uma conta com esse e-mail.";
    case "auth/popup-closed-by-user":
      return "Popup fechado antes de concluir. Tente novamente.";
    case "auth/cancelled-popup-request":
      return "Outra tentativa em andamento. Aguarde e tente de novo.";
    case "auth/popup-blocked":
      return "O navegador bloqueou o popup. Tentaremos redirecionar…";
    default:
      return "Falha ao entrar. Tente novamente.";
  }
}

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const goHome = () => nav("/", { replace: true });

  // Se o Google usar redirect, capturamos o resultado aqui
  useEffect(() => {
    (async () => {
      try {
        const res = await getRedirectResult(auth);
        if (res?.user) goHome();
      } catch (e: any) {
        setErr(friendlyError(e?.code));
      }
    })();
  }, []);

  const loginEmailSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      goHome();
    } catch (e: any) {
      setErr(friendlyError(e?.code));
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    setErr(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      goHome();
    } catch (e: any) {
      if (
        e?.code === "auth/popup-blocked" ||
        e?.code === "auth/operation-not-supported-in-this-environment"
      ) {
        try {
          setErr("O navegador bloqueou o popup. Redirecionando…");
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (er: any) {
          setErr(friendlyError(er?.code));
        }
      } else {
        setErr(friendlyError(e?.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const loginVisitante = async () => {
    setErr(null);
    setLoading(true);
    try {
      await signInAnonymously(auth);
      goHome();
    } catch (e: any) {
      setErr(friendlyError(e?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full grid place-items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
      <div className="w-full mx-auto max-w-[420px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-[640px] xl:max-w-[720px] 2xl:max-w-[820px]">
        <img src={logoUrl} alt="COMPARAFY" className="mx-auto mt-2 mb-8 sm:mb-10 h-7 w-auto" />
        <h1 className="text-center text-2xl font-semibold text-slate-900">Entre com sua conta</h1>

        <form onSubmit={loginEmailSenha} className="mt-5 space-y-3">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] outline-none ring-yellow-500/20 focus:ring-4"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] outline-none ring-yellow-500/20 focus:ring-4"
          />
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-yellow-500 px-4 py-3 font-semibold text-black shadow hover:brightness-95 disabled:opacity-60">
            Entrar
          </button>
        </form>

        <div className="my-3 flex items-center gap-3 text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-sm">ou</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loginGoogle}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] shadow-sm hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          <span>Entrar com Google</span>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={loginVisitante}
          className="mt-3 w-full rounded-xl bg-slate-100 px-4 py-3 text-[15px] hover:bg-slate-200 disabled:opacity-60"
        >
          Continuar como visitante
        </button>

        {err && <p className="mt-3 text-center text-sm text-rose-600">{err}</p>}

        <p className="mt-5 text-center text-[15px] text-slate-700">
          Não tem uma conta?{" "}
          <Link to="/signup" className="font-semibold text-yellow-600 hover:underline">
            Cadastre-se
          </Link>
        </p>

        <p className="mt-2 text-center text-[11px] leading-5 text-slate-500">
          Ao continuar, você concorda com nossos{" "}
          <a href="/terms" className="underline">Termos de uso</a>.
        </p>
      </div>
    </main>
  );
}
