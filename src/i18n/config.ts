export const locales = ["en", "it", "de", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
  de: "Deutsch",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇬🇧",
  it: "🇮🇹",
  de: "🇩🇪",
  es: "🇪🇸",
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
