const TONE_CLASSES = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  brand: "bg-brand-soft text-brand",
  neutral: "bg-stone-dark text-ink-muted",
} as const;

export type PillTone = keyof typeof TONE_CLASSES;

const BASE_PILL_CLASS = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";

export function pillClass(tone: PillTone, extra = ""): string {
  return `${BASE_PILL_CLASS} ${TONE_CLASSES[tone]} ${extra}`;
}

export function StatusPill({
  tone,
  children,
  className = "",
}: {
  tone: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={pillClass(tone, className)}>{children}</span>;
}
