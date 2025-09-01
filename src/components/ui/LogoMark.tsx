import React from "react";

type Props = { className?: string; size?: number };
/** Marca Comparafy – tamanho padrão 40px (Tailwind w-10 h-10)  */
const LogoMark: React.FC<Props> = ({ className = "", size }) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <img
      src="/LOGO_REDUZIDA.png"
      alt="Comparafy"
      className={`w-10 h-10 ${className}`.trim()}
      style={style}
    />
  );
};

export default LogoMark;
