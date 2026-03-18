/**
 * Strips HTML tags, counts words, and returns a Swedish read-time string.
 * Minimum 1 minute. Assumes 200 words per minute.
 */
export function readTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `ca ${minutes} min läsning`;
}
