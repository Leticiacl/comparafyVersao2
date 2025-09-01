import React from "react";

/**
 * Mini sparkline simples (SVG) – sem libs
 * data: números já normalizados; usa 24px de altura por padrão
 */
export default function Sparkline({
  data,
  width = 80,
  height = 24,
  stroke = "#EAB308", // amarelo
}: {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
