"use client";

import { LANGUAGE_LABELS } from "@/lib/utils/language";
import { cn } from "@/lib/utils/cn";

interface LanguageIndicatorProps {
  language: string | null;
  className?: string;
}

export default function LanguageIndicator({
  language,
  className,
}: LanguageIndicatorProps) {
  if (!language) return null;

  const label = LANGUAGE_LABELS[language] ?? language;

  return (
    <span
      aria-label={`Detected language: ${label}`}
      title={`Responding in: ${label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground",
        className
      )}
    >
      <span aria-hidden="true">🌐</span>
      {label}
    </span>
  );
}
