"use client";

import { useActionState, useMemo, useState } from "react";
import { computeShares, round2 } from "@/lib/finance";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { PartnerRow } from "@/lib/types/database";
import type { MonthlyExpenseActionState } from "@/lib/actions/monthlyExpenses";

export interface MonthlyExpenseFormValues {
  month: string; // "YYYY-MM"
  internetBill: string;
  electricityBill: string;
  otherExpense: string;
  otherExpenseNote: string;
}

const EMPTY_VALUES: MonthlyExpenseFormValues = {
  month: "",
  internetBill: "0",
  electricityBill: "0",
  otherExpense: "0",
  otherExpenseNote: "",
};

export function MonthlyExpenseForm({
  dict,
  action,
  partners,
  defaultValues,
}: {
  dict: Dictionary;
  action: (prevState: MonthlyExpenseActionState, formData: FormData) => Promise<MonthlyExpenseActionState>;
  partners: PartnerRow[];
  defaultValues?: Partial<MonthlyExpenseFormValues>;
}) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [values, setValues] = useState<MonthlyExpenseFormValues>({
    ...EMPTY_VALUES,
    ...defaultValues,
  });

  function update<K extends keyof MonthlyExpenseFormValues>(key: K, value: MonthlyExpenseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const preview = useMemo(() => {
    const total = round2(
      (Number(values.internetBill) || 0) +
        (Number(values.electricityBill) || 0) +
        (Number(values.otherExpense) || 0),
    );
    const shares = computeShares(
      total,
      partners.map((p) => ({ partnerId: p.id, ownershipPercent: p.ownership_percent })),
    );
    return { total, shares };
  }, [values.internetBill, values.electricityBill, values.otherExpense, partners]);

  const t = dict.bills;
  const inputClass =
    "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {state.error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <div>
        <label className={labelClass} htmlFor="month">
          {t.month}
        </label>
        <input
          id="month"
          type="month"
          name="month"
          required
          value={values.month}
          onChange={(e) => update("month", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="internetBill">
            {t.internetBill} ({dict.common.sar})
          </label>
          <input
            id="internetBill"
            type="number"
            step="0.01"
            min="0"
            name="internetBill"
            value={values.internetBill}
            onChange={(e) => update("internetBill", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="electricityBill">
            {t.electricityBill} ({dict.common.sar})
          </label>
          <input
            id="electricityBill"
            type="number"
            step="0.01"
            min="0"
            name="electricityBill"
            value={values.electricityBill}
            onChange={(e) => update("electricityBill", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="otherExpense">
          {t.otherExpense} ({dict.common.sar})
        </label>
        <input
          id="otherExpense"
          type="number"
          step="0.01"
          min="0"
          name="otherExpense"
          value={values.otherExpense}
          onChange={(e) => update("otherExpense", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="otherExpenseNote">
          {t.otherExpenseNote}
        </label>
        <textarea
          id="otherExpenseNote"
          name="otherExpenseNote"
          rows={2}
          value={values.otherExpenseNote}
          onChange={(e) => update("otherExpenseNote", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="rounded-md bg-gray-100 p-4">
        <div className="flex justify-between text-sm font-semibold">
          <span>{t.total}</span>
          <span>
            {preview.total.toFixed(2)} {dict.common.sar}
          </span>
        </div>
        <div className="mt-3 space-y-1 border-t border-gray-200 pt-3">
          <p className="text-xs font-medium text-gray-500">{t.shareBreakdown}</p>
          {preview.shares.map((share) => {
            const partner = partners.find((p) => p.id === share.partnerId);
            return (
              <div key={share.partnerId} className="flex justify-between text-sm">
                <span>{partner?.name}</span>
                <span>
                  {share.shareAmount.toFixed(2)} {dict.common.sar}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-base font-medium text-white disabled:opacity-60"
      >
        {isPending ? dict.common.loading : t.save}
      </button>
    </form>
  );
}
