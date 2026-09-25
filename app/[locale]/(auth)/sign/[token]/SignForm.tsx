"use client";

import { useActionState, useState } from "react";
import { signContract, type SignContractActionState } from "@/lib/actions/contract";
import { SignaturePad } from "@/components/contract/SignaturePad";
import type { Dictionary } from "@/lib/i18n/getDictionary";

export function SignForm({
  token,
  partnerName,
  dict,
}: {
  token: string;
  partnerName: string;
  dict: Dictionary["sign"];
}) {
  const [state, formAction, isPending] = useActionState<SignContractActionState, FormData>(
    signContract.bind(null, token),
    {},
  );
  const [agreed, setAgreed] = useState(false);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-ok/30 bg-ok-soft p-6 text-center">
        <p className="text-lg font-semibold text-ok">{dict.successTitle}</p>
        <p className="mt-1.5 text-sm text-ink-muted">{dict.successBody}</p>
      </div>
    );
  }

  const inputClass =
    "mt-1.5 block w-full rounded-lg border border-stone-dark bg-stone/40 px-3.5 py-2.5 text-base text-ink transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-soft";

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-stone-dark bg-surface p-6 shadow-sm">
      <div>
        <label htmlFor="signerName" className="block text-sm font-medium text-ink">
          {dict.signerNameLabel}
        </label>
        <input
          id="signerName"
          name="signerName"
          required
          defaultValue={partnerName}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="nationalId" className="block text-sm font-medium text-ink">
          {dict.nationalIdLabel}
        </label>
        <input id="nationalId" name="nationalId" dir="ltr" className={inputClass} />
      </div>
      <div>
        <p className="text-sm font-medium text-ink">{dict.signatureLabel}</p>
        <div className="mt-1.5">
          <SignaturePad inputName="signatureData" clearLabel={dict.signatureClear} emptyHint={dict.signatureEmptyHint} />
        </div>
      </div>
      <label className="flex items-start gap-2.5 text-sm text-ink-muted">
        <input
          type="checkbox"
          required
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-dark text-brand focus:ring-brand-soft"
        />
        <span>{dict.agreeLabel}</span>
      </label>
      {state.error && (
        <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          {state.error === "empty_signature" ? dict.errorEmpty : dict.errorInvalid}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || !agreed}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {dict.submit}
      </button>
    </form>
  );
}
