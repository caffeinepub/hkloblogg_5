import type { Language } from "../locales/translations";

const labels: Record<Language, { prefix: string; suffix: string }> = {
  en: { prefix: "ca ", suffix: " min read" },
  sv: { prefix: "ca ", suffix: " min läsning" },
  fr: { prefix: "ca ", suffix: " min de lecture" },
  de: { prefix: "ca ", suffix: " Min. Lesezeit" },
  es: { prefix: "ca ", suffix: " min de lectura" },
};

/**
 * Strips HTML tags, counts words, and returns a localised read-time string.
 * Minimum 1 minute. Assumes 200 words per minute.
 */
export function readTime(html: string, lang: Language = "en"): string {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const { prefix, suffix } = labels[lang] ?? labels.en;
  return `${prefix}${minutes}${suffix}`;
}
