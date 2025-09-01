// src/components/BottomNav.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  HomeIcon,
  ListBulletIcon,
  ArrowsRightLeftIcon,
  ShoppingCartIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

type Tab = "home" | "lists" | "compare" | "purchases" | "profile";

const icons: Record<Tab, React.FC<React.SVGProps<SVGSVGElement>>> = {
  home: HomeIcon,
  lists: ListBulletIcon,
  compare: ArrowsRightLeftIcon,
  purchases: ShoppingCartIcon,
  profile: UserIcon,
};

const labels: Record<Tab, string> = {
  home: "Início",
  lists: "Listas",
  compare: "Comparar",
  purchases: "Compras",
  profile: "Perfil",
};

const routes: Record<Tab, string> = {
  home: "/",
  lists: "/lists",
  compare: "/compare",
  purchases: "/purchases",
  profile: "/profile",
};

export default function BottomNav({ activeTab }: { activeTab?: Tab }) {
  const tabs: Tab[] = ["home", "lists", "compare", "purchases", "profile"];

  return (
    <div
      data-bottom-nav
      className="
        fixed inset-x-0 bottom-0 z-40 border-t border-gray-200
        bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70
      "
    >
      <nav className="mx-auto w-full max-w-3xl px-2 sm:px-4 py-1 pb-safe-tight">
        <ul className="grid grid-cols-5 gap-1 sm:gap-1.5">
          {tabs.map((t) => {
            const Icon = icons[t];
            const to = routes[t];
            const active = activeTab === t;

            return (
              <li key={t} className="min-w-0">
                <Link
                  to={to}
                  className={`flex h-[48px] sm:h-[50px] w-full flex-col items-center justify-center rounded-xl transition
                    ${active ? "text-yellow-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Icon className="h-6 w-6 sm:h-[26px] sm:w-[26px]" />
                  <span className="mt-0.5 truncate text-[11px] sm:text-[12px] leading-none">
                    {labels[t]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
