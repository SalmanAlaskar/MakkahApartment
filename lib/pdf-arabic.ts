import ArabicReshaper from "arabic-reshaper";

// pdfkit lays out glyphs left-to-right and does no script shaping or bidi reordering.
// For a pure-Arabic run (no embedded Latin/numerals), shaping into presentation-form
// glyphs and then reversing the character order gives correct visual output on an
// LTR-only renderer. Only safe for strings that are entirely Arabic script.
export function toVisualArabic(text: string): string {
  const reshaped = ArabicReshaper.convertArabic(text);
  return reshaped.split("").reverse().join("");
}

const ARABIC_CHAR = /[؀-ۿݐ-ݿ]/;

// Draws one logical line of (possibly mixed Arabic + number/Latin) text, right-aligned to
// `rightX`, by laying out word-by-word right-to-left ourselves with an explicit space width
// between tokens.
//
// Two things pdfkit/fontkit get wrong if you instead hand them one combined string:
// 1. Feeding a single doc.text() call a string that mixes strong-RTL Arabic presentation-form
//    characters with EN-class digits triggers fontkit's own bidi-ish reordering, which
//    corrupts embedded numbers (e.g. "910,537.01" rendering as "10.735,019").
// 2. Even for pure-Arabic multi-word strings, the plain space characters between reshaped
//    words render with an inconsistent/near-zero gap, visually mashing words together.
// Drawing each word as its own call with a manually measured space width sidesteps both.
export function drawBidiLine(doc: PDFKit.PDFDocument, text: string, rightX: number, y: number): void {
  const words = text.split(" ").filter((w) => w.length > 0);
  const spaceWidth = doc.widthOfString(" ");
  let cursor = rightX;

  words.forEach((word, i) => {
    const isArabic = [...word].some((ch) => ARABIC_CHAR.test(ch));
    const display = isArabic ? ArabicReshaper.convertArabic(word).split("").reverse().join("") : word;
    const width = doc.widthOfString(display);
    if (i > 0) cursor -= spaceWidth;
    doc.text(display, cursor - width, y, { lineBreak: false });
    cursor -= width;
  });
}

// Greedy word-wrap against pdfkit's own font metrics, operating on the LOGICAL (untransformed)
// text -- each wrapped line is later drawn with drawBidiLine, never reassembled/reversed here.
export function wrapText(doc: PDFKit.PDFDocument, text: string, width: number): string[] {
  const words = text.split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && doc.widthOfString(candidate) > width) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
