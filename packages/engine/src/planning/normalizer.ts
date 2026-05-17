export function normalizeText(input: string): string {
  return input
    .trim()
    .replace(/[^\x20-\x7E\xA0-\uFFFF]/g, "")
    .replace(/\s+/g, " ")
    .normalize("NFC");
}
