import ArabicReshaper from "arabic-reshaper";

// pdfkit lays out glyphs left-to-right and does no script shaping or bidi reordering.
// For a pure-Arabic run (no embedded Latin/numerals), shaping into presentation-form
// glyphs and then reversing the character order gives correct visual output on an
// LTR-only renderer. Only safe for strings that are entirely Arabic script.
export function toVisualArabic(text: string): string {
  const reshaped = ArabicReshaper.convertArabic(text);
  return reshaped.split("").reverse().join("");
}
