"use client";

import { useActionState, useState } from "react";
import { updateContractContent, type UpdateContractActionState } from "@/lib/actions/contract";
import { buttonClass } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";

export function ContractEditor({
  locale,
  content,
  version,
  dict,
}: {
  locale: Locale;
  content: string;
  version: number;
  dict: Dictionary;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState<UpdateContractActionState, FormData>(
    updateContractContent.bind(null, locale),
    {},
  );
  const c = dict.contract;

  if (state.success && editing) setEditing(false);

  if (!editing) {
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-ink-faint">
            {c.version} {version}
          </span>
          <button type="button" onClick={() => setEditing(true)} className={buttonClass("secondary", "!px-3 !py-1.5 text-xs")}>
            {c.edit}
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-stone-dark bg-stone/40 p-4 text-sm leading-relaxed text-ink">
          {content}
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(c.editWarning)) e.preventDefault();
      }}
      className="space-y-3"
    >
      <label className="block text-sm font-medium text-ink-muted" htmlFor="content">
        {c.contentLabel}
      </label>
      <textarea
        id="content"
        name="content"
        defaultValue={content}
        rows={20}
        dir="rtl"
        className="block w-full rounded-lg border border-stone-dark bg-stone/40 px-3.5 py-2.5 font-mono text-sm text-ink transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-soft"
      />
      {state.error && <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{c.errorEmpty}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className={buttonClass("primary", "!px-4 !py-2 text-sm disabled:opacity-60")}
        >
          {isPending ? dict.common.loading : dict.common.save}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={buttonClass("secondary", "!px-4 !py-2 text-sm")}>
          {dict.common.cancel}
        </button>
      </div>
    </form>
  );
}
