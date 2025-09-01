import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardDocumentListIcon,
  QrCodeIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

type Slide = {
  title: string;
  subtitle: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const slides: Slide[] = [
  {
    title: "Crie suas listas de compras",
    subtitle: "Organize o que precisa e acompanhe tudo em um só lugar.",
    Icon: ClipboardDocumentListIcon,
  },
  {
    title: "Escaneie suas compras",
    subtitle: "Adicione suas compras apenas escaneando sua notinha.",
    Icon: QrCodeIcon,
  },
  {
    title: "Economize de verdade",
    subtitle: "Acompanhe histórico e planeje suas compras.",
    Icon: BanknotesIcon,
  },
];

const LOGO = import.meta.env.BASE_URL + "COMPARAFY.png";

export default function Onboarding() {
  const nav = useNavigate();
  const [idx, setIdx] = React.useState(0);

  const finish = React.useCallback(() => {
    try { localStorage.setItem("onboardingSeen", "1"); } catch {}
    nav("/login", { replace: true });
  }, [nav]);

  const next = () => (idx < slides.length - 1 ? setIdx(i => i + 1) : finish());
  const skip = finish;

  const { title, subtitle, Icon } = slides[idx];

  return (
    <main className="min-h-screen w-full bg-white px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 flex items-center justify-center">
      <div className="w-full mx-auto text-center
          max-w-[420px] sm:max-w-[480px] md:max-w-[560px]
          lg:max-w-[640px] xl:max-w-[720px] 2xl:max-w-[820px]
          flex flex-col items-center gap-14 sm:gap-17 md:gap-20 py-8 md:py-10">

        {/* logo */}
        <img src={LOGO} alt="COMPARAFY" className="h-7 w-auto" />

        {/* ícone */}
        <div className="inline-flex rounded-full bg-yellow-100 p-5">
          <Icon className="h-9 w-9 text-yellow-600" />
        </div>

        {/* ✅ título + subtítulo MAIS PRÓXIMOS e com fonte menos grossa */}
        <div className="px-2 space-y-3 sm:space-y-3.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-base leading-normal text-slate-600">
            {subtitle}
          </p>
        </div>

        {/* dots */}
        <div className="mt-1 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i === idx ? "bg-yellow-500" : "bg-slate-300"}`} />
          ))}
        </div>

        {/* botões */}
        <div className="w-full pt-2 md:pt-3 space-y-3">
          <button
            onClick={next}
            className="w-full rounded-2xl bg-yellow-500 py-3 text-base font-semibold text-black shadow hover:brightness-95 active:scale-[0.99]"
          >
            {idx < slides.length - 1 ? "Próximo" : "Começar"}
          </button>
          <button
            onClick={skip}
            className="w-full text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
          >
            Pular
          </button>
        </div>
      </div>
    </main>
  );
}
