import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode };
/** Botão primário padronizado (padrão da página Listas) */
const PrimaryButton: React.FC<Props> = ({ children, className = "", ...rest }) => {
  return (
    <button
      className={`w-full bg-yellow-400 text-black font-semibold py-3 rounded-xl shadow ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
