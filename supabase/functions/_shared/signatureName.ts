/** Compare name text without phone-keyboard whitespace or invisible formatting.
 * Keep spelling, accents and punctuation significant. Never use the comparison
 * value in the stored signature audit or signed document.
 */
export function signatureNamesMatch(typed: unknown, legal: unknown): boolean {
  const normalize = (value: unknown): string => typeof value === "string"
    ? value.normalize("NFC")
      .replace(/[\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g, "")
      .replace(/\s+/g, " ").trim().toLowerCase()
    : "";
  const entered = normalize(typed);
  return entered.length > 0 && entered === normalize(legal);
}
