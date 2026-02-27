"use client";

interface PriceTagProps {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
}

export function PriceTag({ price, compareAt, size = "md" }: PriceTagProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={`flex items-baseline gap-2 ${sizeClasses[size]}`}>
      <span className="font-medium tracking-tight">
        €{price.toFixed(2)}
      </span>
      {compareAt != null && compareAt > price && (
        <span className="text-[var(--text-muted)] line-through text-sm">
          €{compareAt.toFixed(2)}
        </span>
      )}
    </div>
  );
}
