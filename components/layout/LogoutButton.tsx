import { logout } from "@/lib/actions/auth";
import type { Locale } from "@/lib/i18n/config";

export function LogoutButton({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={logout.bind(null, locale)}>
      <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
        {label}
      </button>
    </form>
  );
}
