import { getDictionary } from "@/lib/i18n/getDictionary";
import { getSigningContextByToken } from "@/lib/data/contract";
import { listAttachments } from "@/lib/storage/contract-attachments";
import type { Locale } from "@/lib/i18n/config";
import { SignForm } from "./SignForm";

export default async function SignPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = (await params) as { locale: Locale; token: string };
  const dict = getDictionary(locale);
  const context = await getSigningContextByToken(token);

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-stone-dark bg-surface p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-bad">{dict.sign.invalidTitle}</p>
          <p className="mt-1.5 text-sm text-ink-muted">{dict.sign.invalidBody}</p>
        </div>
      </div>
    );
  }

  const attachments = await listAttachments();

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{dict.sign.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{context.partnerName}</p>
        </div>

        <div className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-xs leading-relaxed text-warn">
          {dict.contract.disclaimerBody}
        </div>

        <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-2xl border border-stone-dark bg-surface p-5 text-sm leading-relaxed text-ink shadow-sm">
          {context.contractContent}
        </div>

        {attachments.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-ink-muted">{dict.sign.attachmentsTitle}</h2>
            <ul className="space-y-1.5">
              {attachments.map((file) => (
                <li key={file.name}>
                  <a
                    href={`/${locale}/attachments/${encodeURIComponent(file.name)}?token=${token}`}
                    className="text-sm font-medium text-brand hover:text-brand-dark"
                  >
                    {file.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {context.signedAt ? (
          <div className="rounded-2xl border border-ok/30 bg-ok-soft p-6 text-center">
            <p className="text-lg font-semibold text-ok">{dict.sign.alreadySignedTitle}</p>
            <p className="mt-1.5 text-sm text-ink-muted">{dict.sign.alreadySignedBody}</p>
          </div>
        ) : (
          <SignForm token={token} partnerName={context.partnerName} dict={dict.sign} />
        )}
      </div>
    </div>
  );
}
