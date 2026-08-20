import Link from "next/link";

export function PageHeader({
  title,
  backHref,
  action,
}: {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-1">
        {backHref && (
          <Link
            href={backHref}
            aria-label="back"
            className="-ms-2 flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-stone-dark/60 hover:text-ink"
          >
            <BackIcon />
          </Link>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      {action}
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 rtl:rotate-180"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
