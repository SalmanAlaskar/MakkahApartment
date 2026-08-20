export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BASE = "inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition disabled:opacity-60";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark px-4 py-2.5",
  secondary: "border border-stone-dark bg-surface text-ink hover:bg-stone px-4 py-2.5",
  ghost: "text-ink-muted hover:text-ink px-2 py-1",
  danger: "text-bad hover:underline px-0 py-0",
};

export function buttonClass(variant: ButtonVariant = "primary", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`;
}
