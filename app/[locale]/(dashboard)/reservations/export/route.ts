import path from "path";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  DEFAULT_RESERVATION_SORT,
  getSortedReservations,
  isReservationSort,
  type ReservationReportRow,
} from "@/lib/data/reservations";
import { toVisualArabic } from "@/lib/pdf-arabic";

export const runtime = "nodejs";

const ARABIC_PATTERN = /[؀-ۿ]/;

function money(value: number): string {
  return Number(value).toFixed(2);
}

function buildWorkbookBuffer(rows: ReservationReportRow[]): Buffer {
  const sheetRows = rows.map((r) => ({
    Guest: r.guest_name,
    Platform: r.platform,
    "Rental Type": r.rental_type,
    "Check-in": r.check_in,
    "Check-out": r.check_out,
    "Gross (SAR)": Number(r.gross_amount),
    "Paid (SAR)": Number(r.paid_amount),
    "Fee (SAR)": Number(r.fee_amount),
    "Expense (SAR)": Number(r.expense_amount),
    "Net (SAR)": Number(r.net_amount),
    Status: r.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reservations");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const PDF_COLUMNS: Array<{ key: keyof ReservationReportRow; label: string; width: number; money?: boolean }> = [
  { key: "guest_name", label: "Guest", width: 140 },
  { key: "check_in", label: "Check-in", width: 75 },
  { key: "check_out", label: "Check-out", width: 75 },
  { key: "gross_amount", label: "Gross", width: 65, money: true },
  { key: "fee_amount", label: "Fee", width: 55, money: true },
  { key: "expense_amount", label: "Expense", width: 65, money: true },
  { key: "net_amount", label: "Net", width: 65, money: true },
  { key: "status", label: "Status", width: 70 },
];

function buildPdfBuffer(rows: ReservationReportRow[]): Promise<Buffer> {
  // pdfkit's PDFDocument constructor initializes with its own bundled "Helvetica" as the
  // default font, loaded via a path that breaks under Next's Turbopack bundling for Route
  // Handlers. Passing `font` here makes our own embedded font the default from the start,
  // so pdfkit never touches its bundled standard-font files at all. This one font (Noto
  // Naskh Arabic) covers both the Arabic guest names and the Latin/English labels.
  const fontPath = path.join(process.cwd(), "assets/fonts/NotoNaskhArabic-Regular.ttf");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape", font: fontPath });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const startX = doc.page.margins.left;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    let y = doc.page.margins.top;

    function drawHeaderRow() {
      doc.fontSize(9).fillColor("#000000");
      let x = startX;
      for (const col of PDF_COLUMNS) {
        doc.text(col.label, x, y, { width: col.width });
        x += col.width;
      }
      y += 16;
      doc.moveTo(startX, y).lineTo(x, y).strokeColor("#cccccc").stroke();
      y += 6;
    }

    doc.fontSize(16).fillColor("#000000").text("Reservations Report", startX, y);
    y += 24;
    doc.fontSize(8).fillColor("#666666").text(`${rows.length} reservation${rows.length === 1 ? "" : "s"}`, startX, y);
    y += 18;

    drawHeaderRow();
    doc.fontSize(9).fillColor("#000000");

    for (const row of rows) {
      if (y > pageBottom - 20) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeaderRow();
        doc.fontSize(9).fillColor("#000000");
      }

      let x = startX;
      for (const col of PDF_COLUMNS) {
        const raw = row[col.key];
        const text = col.money ? money(Number(raw)) : String(raw ?? "");
        const display = ARABIC_PATTERN.test(text) ? toVisualArabic(text) : text;
        doc.text(display, x, y, { width: col.width });
        x += col.width;
      }
      y += 18;
    }

    doc.end();
  });
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");
  const sortParam = searchParams.get("sort") ?? undefined;
  const sort = isReservationSort(sortParam) ? sortParam : DEFAULT_RESERVATION_SORT;

  const rows = await getSortedReservations(sort);

  if (format === "xlsx") {
    const buffer = buildWorkbookBuffer(rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="reservations_report.xlsx"',
      },
    });
  }

  if (format === "pdf") {
    const buffer = await buildPdfBuffer(rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="reservations_report.pdf"',
      },
    });
  }

  return new NextResponse("Unknown format", { status: 400 });
}
