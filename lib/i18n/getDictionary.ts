import type { Locale } from "./config";
import ar from "./dictionaries/ar.json";
import en from "./dictionaries/en.json";

const dictionaries = { ar, en } satisfies Record<Locale, typeof ar>;

export type Dictionary = typeof ar;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
