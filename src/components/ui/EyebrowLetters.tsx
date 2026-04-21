"use client";

interface EyebrowLettersProps {
  text: string;
  className?: string;
  /** delay per letter in seconds */
  step?: number;
  /** starting delay */
  startDelay?: number;
}

/**
 * Renders text with each letter fading in one by one.
 * Respects prefers-reduced-motion via the CSS keyframe rule in globals.css.
 */
export function EyebrowLetters({
  text,
  className = "",
  step = 0.05,
  startDelay = 0.1,
}: EyebrowLettersProps) {
  return (
    <p className={`eyebrow-letters ${className}`} aria-label={text}>
      {Array.from(text).map((char, i) => (
        <span
          key={i}
          style={{ animationDelay: `${startDelay + i * step}s` }}
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </p>
  );
}
