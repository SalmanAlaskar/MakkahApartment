import fs from "fs";
import path from "path";

let cachedFontDataUri: string | null = null;

function getFontDataUri(): string {
  if (cachedFontDataUri) return cachedFontDataUri;
  const fontPath = path.join(process.cwd(), "assets/fonts/IBMPlexSansArabic-Regular.ttf");
  const base64 = fs.readFileSync(fontPath).toString("base64");
  cachedFontDataUri = `data:font/ttf;base64,${base64}`;
  return cachedFontDataUri;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Paragraphs are separated by blank lines in the stored text; single newlines within a
// paragraph are preserved as <br>.
function contentToHtml(content: string): string {
  return content
    .split(/\r?\n\r?\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim()).replace(/\r?\n/g, "<br>")}</p>`)
    .join("\n");
}

export function buildContractHtml(
  content: string,
  signatures: Array<{ partnerName: string; signedAt: string | null }>,
): string {
  const fontDataUri = getFontDataUri();

  const signatureRows = signatures
    .map((s) => {
      const status = s.signedAt
        ? `تم التوقيع بتاريخ ${new Date(s.signedAt).toLocaleString("en-GB")}`
        : "بانتظار التوقيع";
      return `<li><span class="name">${escapeHtml(s.partnerName)}</span><span class="status">${escapeHtml(status)}</span></li>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: "IBM Plex Sans Arabic";
    src: url(${fontDataUri}) format("truetype");
  }
  * { box-sizing: border-box; }
  body {
    font-family: "IBM Plex Sans Arabic", sans-serif;
    font-size: 13px;
    line-height: 1.9;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 18px;
    margin: 0 0 18px;
  }
  p {
    margin: 0 0 12px;
    text-align: justify;
  }
  hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 24px 0;
  }
  h2 {
    font-size: 15px;
    margin: 0 0 14px;
  }
  ul.signatures {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  ul.signatures li {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 12px;
  }
  ul.signatures .name {
    font-weight: 600;
  }
  ul.signatures .status {
    color: #555;
  }
</style>
</head>
<body>
${contentToHtml(content)}
<hr>
<h2>سجل التوقيعات</h2>
<ul class="signatures">
${signatureRows}
</ul>
</body>
</html>`;
}
