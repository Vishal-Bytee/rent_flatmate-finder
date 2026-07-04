import { useState } from "react";

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-full w-full" aria-hidden="true">
      <path
        d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.77l-5.2 2.75.99-5.8-4.21-4.1 5.82-.85L10 1.5z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

export function StarRatingDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  const rounded = Math.round(value);
  return (
    <div className="flex gap-0.5 text-clay">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={dimension}>
          <Star filled={rounded >= i} />
        </div>
      ))}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (stars: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex gap-1 text-clay">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
          className="focus-ring h-7 w-7 rounded disabled:opacity-50"
        >
          <Star filled={shown >= i} />
        </button>
      ))}
    </div>
  );
}
