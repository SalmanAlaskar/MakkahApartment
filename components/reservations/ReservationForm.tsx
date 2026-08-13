"use client";

import { useMemo, useState } from "react";
import { computeFee, computeShares, type FeeMethod } from "@/lib/finance";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { PartnerRow } from "@/lib/types/database";

export interface ReservationFormValues {
  guestName: string;
  platform: string;
  rentalType: string;
  checkIn: string;
  checkOut: string;
  grossAmount: string;
  paidAmount: string;
  paymentMethod: string;
  feeMethod: FeeMethod;
  feeAmount: string;
  feePercent: string;
  expenseAmount: string;
  expenseNote: string;
  status: string;
  notes: string;
}

const EMPTY_VALUES: ReservationFormValues = {
  guestName: "",
  platform: "direct",
  rentalType: "daily",
  checkIn: "",
  checkOut: "",
  grossAmount: "",
  paidAmount: "",
  paymentMethod: "cash",
  feeMethod: "flat_amount",
  feeAmount: "",
  feePercent: "",
  expenseAmount: "0",
  expenseNote: "",
  status: "confirmed",
  notes: "",
};

export function ReservationForm({
  dict,
  action,
  partners,
  defaultValues,
}: {
  dict: Dictionary;
  action: (formData: FormData) => void;
  partners: PartnerRow[];
  defaultValues?: Partial<ReservationFormValues>;
}) {
  const [values, setValues] = useState<ReservationFormValues>({
    ...EMPTY_VALUES,
    ...defaultValues,
  });

  function update<K extends keyof ReservationFormValues>(key: K, value: ReservationFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const preview = useMemo(() => {
    const gross = Number(values.grossAmount) || 0;
    const expense = Number(values.expenseAmount) || 0;
    const { feeAmount, netAmount } = computeFee({
      grossAmount: gross,
      feeMethod: values.feeMethod,
      feeAmount: Number(values.feeAmount) || 0,
      feePercent: Number(values.feePercent) || 0,
      expenseAmount: expense,
    });
    const shares = computeShares(
      netAmount,
      partners.map((p) => ({ partnerId: p.id, ownershipPercent: p.ownership_percent })),
    );
    return { feeAmount, netAmount, shares };
  }, [values.grossAmount, values.feeMethod, values.feeAmount, values.feePercent, values.expenseAmount, partners]);

  const t = dict.reservations;
  const inputClass =
    "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={labelClass} htmlFor="guestName">
          {t.guestName}
        </label>
        <input
          id="guestName"
          name="guestName"
          required
          value={values.guestName}
          onChange={(e) => update("guestName", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="checkIn">
            {t.checkIn}
          </label>
          <input
            id="checkIn"
            type="date"
            name="checkIn"
            required
            value={values.checkIn}
            onChange={(e) => update("checkIn", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="checkOut">
            {t.checkOut}
          </label>
          <input
            id="checkOut"
            type="date"
            name="checkOut"
            required
            value={values.checkOut}
            onChange={(e) => update("checkOut", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="platform">
            {t.platform}
          </label>
          <select
            id="platform"
            name="platform"
            value={values.platform}
            onChange={(e) => update("platform", e.target.value)}
            className={inputClass}
          >
            <option value="direct">{t.platform_direct}</option>
            <option value="airbnb">{t.platform_airbnb}</option>
            <option value="booking">{t.platform_booking}</option>
            <option value="other">{t.platform_other}</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="rentalType">
            {t.rentalType}
          </label>
          <select
            id="rentalType"
            name="rentalType"
            value={values.rentalType}
            onChange={(e) => update("rentalType", e.target.value)}
            className={inputClass}
          >
            <option value="daily">{t.rentalType_daily}</option>
            <option value="monthly">{t.rentalType_monthly}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="grossAmount">
            {t.grossAmount} ({dict.common.sar})
          </label>
          <input
            id="grossAmount"
            type="number"
            step="0.01"
            min="0"
            name="grossAmount"
            required
            value={values.grossAmount}
            onChange={(e) => update("grossAmount", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="paidAmount">
            {t.paidAmount} ({dict.common.sar})
          </label>
          <input
            id="paidAmount"
            type="number"
            step="0.01"
            min="0"
            name="paidAmount"
            required
            value={values.paidAmount}
            onChange={(e) => update("paidAmount", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="paymentMethod">
          {t.paymentMethod}
        </label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={values.paymentMethod}
          onChange={(e) => update("paymentMethod", e.target.value)}
          className={inputClass}
        >
          <option value="cash">{t.payment_cash}</option>
          <option value="bank_transfer">{t.payment_bank_transfer}</option>
          <option value="other">{t.platform_other}</option>
        </select>
      </div>

      <fieldset className="rounded-md border border-gray-200 p-3">
        <label className={labelClass} htmlFor="feeMethod">
          {t.feeMethod}
        </label>
        <select
          id="feeMethod"
          name="feeMethod"
          value={values.feeMethod}
          onChange={(e) => update("feeMethod", e.target.value as FeeMethod)}
          className={inputClass}
        >
          <option value="flat_amount">{t.feeMethod_flat_amount}</option>
          <option value="percent_of_gross">{t.feeMethod_percent_of_gross}</option>
        </select>

        {values.feeMethod === "flat_amount" ? (
          <div className="mt-3">
            <label className={labelClass} htmlFor="feeAmount">
              {t.feeAmount} ({dict.common.sar})
            </label>
            <input
              id="feeAmount"
              type="number"
              step="0.01"
              min="0"
              name="feeAmount"
              value={values.feeAmount}
              onChange={(e) => update("feeAmount", e.target.value)}
              className={inputClass}
            />
          </div>
        ) : (
          <div className="mt-3">
            <label className={labelClass} htmlFor="feePercent">
              {t.feePercent}
            </label>
            <input
              id="feePercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              name="feePercent"
              value={values.feePercent}
              onChange={(e) => update("feePercent", e.target.value)}
              className={inputClass}
            />
          </div>
        )}
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="expenseAmount">
          {t.expenseAmount} ({dict.common.sar})
        </label>
        <input
          id="expenseAmount"
          type="number"
          step="0.01"
          name="expenseAmount"
          value={values.expenseAmount}
          onChange={(e) => update("expenseAmount", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="expenseNote">
          {t.expenseNote}
        </label>
        <textarea
          id="expenseNote"
          name="expenseNote"
          rows={2}
          value={values.expenseNote}
          onChange={(e) => update("expenseNote", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="status">
          {t.status}
        </label>
        <select
          id="status"
          name="status"
          value={values.status}
          onChange={(e) => update("status", e.target.value)}
          className={inputClass}
        >
          <option value="confirmed">{t.status_confirmed}</option>
          <option value="cancelled">{t.status_cancelled}</option>
          <option value="completed">{t.status_completed}</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="notes">
          {t.notes}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="rounded-md bg-gray-100 p-4">
        <div className="flex justify-between text-sm">
          <span>{t.feeAmount}</span>
          <span>
            {preview.feeAmount.toFixed(2)} {dict.common.sar}
          </span>
        </div>
        <div className="mt-1 flex justify-between text-sm font-semibold">
          <span>{t.netAmount}</span>
          <span>
            {preview.netAmount.toFixed(2)} {dict.common.sar}
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
        className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-base font-medium text-white"
      >
        {dict.common.save}
      </button>
    </form>
  );
}
