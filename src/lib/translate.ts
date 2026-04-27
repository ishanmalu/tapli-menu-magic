/**
 * Translate text using the MyMemory free API (no key needed, 1000 req/day).
 * langPair examples: "fi|en", "en|fi"
 */
export async function translate(text: string, from: "fi" | "en", to: "fi" | "en"): Promise<string> {
  if (!text.trim()) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation request failed");
  const json = await res.json();
  const translated: string = json?.responseData?.translatedText ?? "";
  if (!translated || translated.toUpperCase() === text.toUpperCase()) throw new Error("No translation returned");
  return translated;
}
