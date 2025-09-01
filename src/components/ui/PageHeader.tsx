import React from "react";
import LogoMark from "./LogoMark";

type Props = {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

/**
 * PageHeader sem botão de instalar (limpo e padronizado).
 * - Logo à direita habilitada por padrão (showLogo).
 * - Permite leftSlot/rightSlot para customizações futuras.
 */
const PageHeader: React.FC<Props> = ({ title, subtitle, showLogo = true, leftSlot, rightSlot }) => {
  return (
    <header className="mb-2 flex items-center justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {leftSlot}
          <h1 className="truncate text-2xl font-extrabold text-gray-900">{title}</h1>
        </div>
        {subtitle && <div className="mt-1 text-sm text-gray-600">{subtitle}</div>}
      </div>
      <div className="ml-3 flex items-center gap-2">
        {rightSlot}
        {showLogo && <LogoMark />}
      </div>
    </header>
  );
};

export default PageHeader;
