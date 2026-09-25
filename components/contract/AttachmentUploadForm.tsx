"use client";

import { useActionState, useRef } from "react";
import { uploadContractAttachment, type UploadAttachmentActionState } from "@/lib/actions/contract";
import { buttonClass } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export function AttachmentUploadForm({ locale, label }: { locale: Locale; label: string }) {
  const [state, formAction, isPending] = useActionState<UploadAttachmentActionState, FormData>(
    uploadContractAttachment.bind(null, locale),
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex items-center gap-2"
    >
      <input
        type="file"
        name="file"
        required
        className="block flex-1 text-xs text-ink-muted file:mr-2 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand"
      />
      <button type="submit" disabled={isPending} className={buttonClass("secondary", "!px-3 !py-1.5 text-xs disabled:opacity-60")}>
        {label}
      </button>
      {state.error && <span className="text-xs text-bad">!</span>}
    </form>
  );
}
