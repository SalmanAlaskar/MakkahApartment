import path from "path";
import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getContractWithSignatures } from "@/lib/data/contract";
import { drawBidiLine, wrapText } from "@/lib/pdf-arabic";

export const runtime = "nodejs";

function buildPdfBuffer(content: string, signatures: Array<{ partnerName: string; signedAt: string | null }>): Promise<Buffer> {
  const fontPath = path.join(process.cwd(), "assets/fonts/NotoNaskhArabic-Regular.ttf");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4", font: fontPath });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const startX = doc.page.margins.left;
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const rightX = startX + contentWidth;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const lineHeight = 16;
    let y = doc.page.margins.top;

    function ensureSpace(needed: number) {
      if (y + needed > pageBottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    }

    doc.fontSize(11);
    for (const paragraph of content.split("\n")) {
      if (paragraph.trim() === "") {
        y += lineHeight * 0.6;
        continue;
      }
      const lines = wrapText(doc, paragraph, contentWidth);
      for (const line of lines) {
        ensureSpace(lineHeight);
        drawBidiLine(doc, line, rightX, y);
        y += lineHeight;
      }
      y += lineHeight * 0.4;
    }

    ensureSpace(lineHeight * 3);
    y += lineHeight;
    doc.moveTo(startX, y).lineTo(rightX, y).strokeColor("#cccccc").stroke();
    y += lineHeight;
    doc.fontSize(13);
    drawBidiLine(doc, "سجل التوقيعات", rightX, y);
    y += lineHeight * 1.5;

    doc.fontSize(11);
    for (const sig of signatures) {
      ensureSpace(lineHeight);
      const status = sig.signedAt
        ? `تم التوقيع بتاريخ ${new Date(sig.signedAt).toLocaleString("en-GB")}`
        : "بانتظار التوقيع";
      drawBidiLine(doc, `${sig.partnerName} — ${status}`, rightX, y);
      y += lineHeight;
    }

    doc.end();
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return new NextResponse("Unauthorized", { status: 401 });

  const contract = await getContractWithSignatures();
  if (!contract) return new NextResponse("Not found", { status: 404 });

  const buffer = await buildPdfBuffer(
    contract.content,
    contract.signatures.map((s) => ({ partnerName: s.partnerName, signedAt: s.signedAt })),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="partnership_contract.pdf"',
    },
  });
}
