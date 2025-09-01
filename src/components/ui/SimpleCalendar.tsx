import React, { useMemo, useState } from "react";

type Props = {
  value?: string;                  // "YYYY-MM-DD"
  onChange: (iso: string) => void; // retorna "YYYY-MM-DD"
  onClose?: () => void;
};

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromISO(iso?: string) {
  if (!iso) return new Date();
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Segunda-feira como primeiro dia da semana
function startOfCalendar(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const dow = first.getDay(); // 0 (dom) .. 6 (sáb)
  const mondayIndex = (dow - 1 + 7) % 7;
  first.setDate(first.getDate() - mondayIndex);
  return first;
}

export default function SimpleCalendar({ value, onChange, onClose }: Props) {
  const [cursor, setCursor] = useState<Date>(() => {
    const d = fromISO(value);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const selected = fromISO(value);

  const matrix = useMemo(() => {
    const start = startOfCalendar(cursor);
    const days: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({
        date: d,
        inMonth: d.getMonth() === cursor.getMonth(),
      });
    }
    return days;
  }, [cursor]);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(cursor);

  const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"]; // seg..dom, visual curto

  const select = (d: Date) => {
    onChange(toISO(d));
    onClose?.();
  };

  return (
    <div className="mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={() =>
            setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))
          }
        >
          ‹
        </button>
        <div className="text-sm font-medium capitalize">{monthLabel}</div>
        <button
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={() =>
            setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))
          }
        >
          ›
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 px-2 pb-1 text-center text-xs text-gray-500">
        {weekDays.map((w) => (
          <div key={w} className="py-1">{w}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 px-2 pb-3">
        {matrix.map(({ date, inMonth }) => {
          const isSelected =
            date.getFullYear() === selected.getFullYear() &&
            date.getMonth() === selected.getMonth() &&
            date.getDate() === selected.getDate();

          const cls =
            "py-2 rounded text-sm " +
            (isSelected
              ? "bg-yellow-500 text-black font-semibold"
              : inMonth
              ? "text-gray-900 hover:bg-gray-100"
              : "text-gray-400 hover:bg-gray-100");

          return (
            <button
              key={date.toISOString()}
              className={cls}
              onClick={() => select(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between px-3 pb-3">
        <button
          className="text-xs text-gray-600 underline"
          onClick={() => {
            const now = new Date();
            setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            select(now);
          }}
        >
          Hoje
        </button>
        {onClose && (
          <button
            className="text-xs text-gray-600 underline"
            onClick={() => onClose()}
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}