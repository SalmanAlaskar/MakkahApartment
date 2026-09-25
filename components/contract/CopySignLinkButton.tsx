"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";

export function CopySignLinkButton({ path, label, copiedLabel }: { path: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (insecure context, permissions); fall back silently.
      window.prompt(label, url);
    }
  }

  return (
    <button type="button" onClick={handleClick} className={buttonClass("secondary", "!px-2.5 !py-1 text-xs")}>
      {copied ? copiedLabel : label}
    </button>
  );
}
