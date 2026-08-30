"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { StatusPill, type PillTone } from "@/components/ui/StatusPill";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { ReservationReportRow } from "@/lib/data/reservations";
import type { Locale } from "@/lib/i18n/config";

const STATUS_TONE: Record<string, PillTone> = {
  confirmed: "brand",
  completed: "ok",
  cancelled: "neutral",
};

const STATUSES = ["confirmed", "completed", "cancelled"] as const;

export function ReservationsList({
  reservations,
  locale,
  dict,
}: {
  reservations: ReservationReportRow[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const t = dict.reservations;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations.filter((r) => {
      const matchesQuery = q.length === 0 || r.guest_name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [reservations, query, statusFilter]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.searchPlaceholder}
        className="mb-3 block w-full rounded-lg border border-stone-dark bg-stone/40 px-3.5 py-2.5 text-sm text-ink transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-soft"
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        <FilterChip label={t.filterAll} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
        {STATUSES.map((status) => (
          <FilterChip
            key={status}
            label={t[`status_${status}` as keyof typeof t]}
            active={statusFilter === status}
            onClick={() => setStatusFilter(status)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-faint">{t.noReservations}</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                href={`/${locale}/reservations/${r.id}`}
                className="block rounded-xl border border-stone-dark bg-surface p-4 shadow-sm transition hover:border-brand/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{r.guest_name}</span>
                  <StatusPill tone={STATUS_TONE[r.status] ?? "neutral"}>
                    {t[`status_${r.status}` as keyof typeof t]}
                  </StatusPill>
                </div>
                <div className="mt-1 text-sm text-ink-faint" dir="ltr">
                  {r.check_in} → {r.check_out}
                </div>
                <div className="mt-2.5 flex justify-between border-t border-stone pt-2.5 text-sm">
                  <span className="text-ink-muted">{t.grossAmount}</span>
                  <span className="tabular-nums text-ink">
                    {formatMoney(r.gross_amount)} {dict.common.sar}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-ink-muted">{t.netAmount}</span>
                  <span className="tabular-nums text-ink">
                    {formatMoney(r.net_amount)} {dict.common.sar}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
        active ? "bg-brand text-white" : "bg-stone-dark/60 text-ink-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}
