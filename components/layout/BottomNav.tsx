"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, CalendarIcon, UsersIcon, SettingsIcon } from "./icons";

export type NavIcon = "dashboard" | "reservations" | "partners" | "settings";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
}

const ICONS: Record<NavIcon, typeof HomeIcon> = {
  dashboard: HomeIcon,
  reservations: CalendarIcon,
  partners: UsersIcon,
  settings: SettingsIcon,
};

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl justify-around">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                active ? "text-sky-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-5 w-5" filled={active} />
              <span className={active ? "font-medium" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
