import React from "react";

type Size = "sm" | "md" | number;

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: Size;
  className?: string;
};

function sizeClasses(size: Size) {
  if (typeof size === "number") return { box: `h-[${size}px] w-[${size}px]`, icon: "h-3 w-3" };
  if (size === "sm") return { box: "h-5 w-5", icon: "h-3 w-3" };
  return { box: "h-6 w-6", icon: "h-3.5 w-3.5" };
}

export default function RoundCheck({ checked, onChange, size = "md", className = "" }: Props) {
  const s = sizeClasses(size);
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`inline-flex items-center justify-center rounded-full border transition
      ${checked ? "bg-yellow-500 border-yellow-500" : "bg-white border-gray-300"}
      ${s.box} shadow-sm ${className}`}
    >
      {checked && (
        <svg viewBox="0 0 20 20" className={`${s.icon} text-white`} fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 11.086l6.543-6.543a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}
