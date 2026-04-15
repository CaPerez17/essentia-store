"use client";

interface PriceTagProps {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
}

const fmt = (n: number) =>
  "$\u00A0" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

export function PriceTag({ price, compareAt, size = "md" }: PriceTagProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`flex items-baseline gap-2 ${sizeClasses[size]}`}>
      <span className="text-[var(--muted)] tracking-tight">
        {fmt(price)}
      </span>
      {compareAt != null && compareAt > price && (
        <span className="text-[var(--muted)]/50 line-through text-[10px]">
          {fmt(compareAt)}
        </span>
      )}
    </div>
  );
}
