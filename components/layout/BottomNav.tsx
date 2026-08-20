"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  icon: "home" | "calendar" | "people" | "gear";
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-stone-dark bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl justify-around">
        {items.map((item) => {
          const isActive =
            pathname === item.href || (item.href.endsWith("/dashboard") ? false : pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                isActive ? "text-brand" : "text-ink-faint hover:text-ink-muted"
              }`}
            >
              <Icon name={item.icon} active={!!isActive} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Icon({ name, active }: { name: NavItem["icon"]; active: boolean }) {
  const stroke = active ? 2.2 : 1.8;
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, className: "h-5 w-5" };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path strokeLinecap="round" d="M3 9.5h18M8 3v3M16 3v3" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9.5" r="2.3" />
          <path
            strokeLinecap="round"
            d="M3.5 20c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2M14.8 15.3c2.6.2 4.7 2.1 4.7 4.7"
          />
        </svg>
      );
    case "gear":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path
            strokeLinecap="round"
            d="M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
          />
        </svg>
      );
  }
}
