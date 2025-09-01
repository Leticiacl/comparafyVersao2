import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "@/services/firebase";

const LOGO = import.meta.env.BASE_URL + "COMPARAFY.png";

const GoogleIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.61l6.9-6.9C36.66 2.49 30.73 0 24 0 14.62 0 6.39 5.38 2.56 13.22l8.08 6.26C12.3 14.3 17.65 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24c0-1.57-.14-3.08-.41-4.5H24v9h12.65c-.55 2.96-2.23 5.47-4.74 7.17l7.24 5.62C43.82 37.83 46.5 31.4 46.5 24z"/>
    <path fill="#FBBC05" d="M10.64 28.52c-.48-1.43-.75-2.95-.75-4.52s.27-3.09.75-4.52l-8.08-6.26C.93 16.05 0 19.91 0 24s.93 7.95 2.56 10.78l8.08-6.26z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.83l-7.24-5.62c-2.01 1.35-4.59 2.15-8.66 2.15-6.35 0-11.74-4.28-13.67-10.18l-8.08 6.26C6.39 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function Signup() {
  const nav = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toLogin = () => nav("/login", { replace: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      if (nome.trim()) await updateProfile(cred.user, { displayName: nome.trim() });
      await signOut(auth);           // <- não entra direto
      toLogin();                     // <- volta para login
    } catch (e: any) {
      const code = e?.code as string | undefined;
      let msg = "Falha ao cadastrar. Tente novamente.";
      if (code === "auth/email-already-in-use") msg = "Este e-mail já está em uso.";
      if (code === "auth/weak-password") msg = "Senha muito curta (mínimo 6 caracteres).";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const signupGoogle = async () => {
    setErr(null);
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      await signOut(auth);           // <- não entra direto
      toLogin();                     // <- volta para login
    } catch (e: any) {
      setErr("Falha ao cadastrar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full grid place-items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24">
      <div className="w-full mx-auto
        max-w-[420px] sm:max-w-[480px] md:max-w-[560px]
        lg:max-w-[640px] xl:max-w-[720px] 2xl:max-w-[820px]">

        {/* + espaço da logo para o título */}
        <img src={LOGO} alt="COMPARAFY" className="mx-auto mt-2 mb-8 sm:mb-10 h-7 w-auto" />

        <h1 className="text-center text-2xl font-semibold text-slate-900">
          Crie sua conta
        </h1>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            placeholder="Nome (opcional)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] outline-none ring-yellow-500/20 focus:ring-4"
          />
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
            autoComplete="new-password"
            placeholder="Senha (mín. 6)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] outline-none ring-yellow-500/20 focus:ring-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-yellow-500 px-4 py-3 font-semibold text-black shadow hover:brightness-95 disabled:opacity-60"
          >
            Cadastrar
          </button>
        </form>

        {/* com ícone do Google */}
        <button
          type="button"
          disabled={loading}
          onClick={signupGoogle}
          className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] shadow-sm hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          <span>Cadastrar com Google</span>
        </button>

        {err && <p className="mt-3 text-center text-sm text-rose-600">{err}</p>}

        <p className="mt-5 text-center text-[15px] text-slate-700">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-yellow-600 hover:underline">
            Entrar
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
