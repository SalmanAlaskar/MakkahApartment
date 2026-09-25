import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getContractWithSignatures } from "@/lib/data/contract";
import { listAttachments } from "@/lib/storage/contract-attachments";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { buttonClass } from "@/components/ui/button";
import { ContractEditor } from "@/components/contract/ContractEditor";
import { CopySignLinkButton } from "@/components/contract/CopySignLinkButton";
import { AttachmentUploadForm } from "@/components/contract/AttachmentUploadForm";
import { DeleteAttachmentButton } from "@/components/contract/DeleteAttachmentButton";
import type { Locale } from "@/lib/i18n/config";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  const c = dict.contract;
  const contract = await getContractWithSignatures();
  const attachments = await listAttachments();

  return (
    <div className="space-y-5">
      <PageHeader
        title={c.title}
        backHref={`/${locale}/settings`}
        action={
          <a href={`/${locale}/contract/export`} className={buttonClass("secondary", "!px-3 !py-1.5 text-xs")}>
            {c.download}
          </a>
        }
      />

      <div className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-warn">
        <p className="mb-1 font-semibold">{c.disclaimerTitle}</p>
        <p>{c.disclaimerBody}</p>
      </div>

      {contract ? (
        <>
          <Card>
            <ContractEditor locale={locale} content={contract.content} version={contract.version} dict={dict} />
          </Card>

          <div>
            <h2 className="mb-2 text-sm font-medium text-ink-muted">{c.signatureStatusTitle}</h2>
            <ul className="space-y-2">
              {contract.signatures.map((s) => (
                <li
                  key={s.partnerId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-dark bg-surface p-3.5 text-sm shadow-sm"
                >
                  <div>
                    <p className="font-medium text-ink">{s.partnerName}</p>
                    {s.signedAt && (
                      <p className="text-xs text-ink-faint" dir="ltr">
                        {c.signedOn} {new Date(s.signedAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={s.signedAt ? "ok" : "warn"}>{s.signedAt ? c.signed : c.pending}</StatusPill>
                    {!s.signedAt && s.signToken && (
                      <CopySignLinkButton
                        path={`/${locale}/sign/${s.signToken}`}
                        label={c.copyLink}
                        copiedLabel={c.linkCopied}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm text-ink-muted">-</p>
        </Card>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-ink-muted">{c.attachmentsTitle}</h2>
        <Card className="space-y-3">
          <AttachmentUploadForm locale={locale} label={c.upload} />
          {attachments.length === 0 ? (
            <p className="text-sm text-ink-faint">{c.noAttachments}</p>
          ) : (
            <ul className="space-y-1.5">
              {attachments.map((file) => (
                <li key={file.name} className="flex items-center justify-between gap-2 text-sm">
                  <a
                    href={`/${locale}/attachments/${encodeURIComponent(file.name)}`}
                    className="truncate font-medium text-brand hover:text-brand-dark"
                  >
                    {file.name}
                  </a>
                  <DeleteAttachmentButton
                    locale={locale}
                    name={file.name}
                    label={dict.common.delete}
                    confirmMessage={c.confirmDeleteAttachment}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
