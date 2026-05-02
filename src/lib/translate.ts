import { ALL_LANGUAGES } from "@/constants/languages";

// Translation requests go through a Cloudflare Pages Function at /api/translate
// so the DeepL API key stays server-side and CORS is never an issue.
// The function runs on the same domain as the app — no cross-origin requests.

async function callTranslateAPI(
  texts: string[],
  targetLangCode: string,
  sourceLangCode?: string
): Promise<string[]> {
  const lang = ALL_LANGUAGES.find((l) => l.code === targetLangCode);
  if (!lang) throw new Error(`Unknown language: ${targetLangCode}`);

  const body: Record<string, unknown> = { texts, targetLang: lang.deeplCode };
  if (sourceLangCode) {
    const src = ALL_LANGUAGES.find((l) => l.code === sourceLangCode);
    if (src) body.sourceLang = src.deeplCode.split("-")[0];
  }

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Translation failed (${res.status}): ${err}`);
  }

  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.translations as string[];
}

/**
 * Translate a single piece of text.
 * targetLangCode is our internal code (e.g. "sv", "de", "fi", "en").
 */
export async function translateText(
  text: string,
  targetLangCode: string,
  sourceLangCode?: string
): Promise<string> {
  if (!text.trim()) return "";
  const results = await callTranslateAPI([text], targetLangCode, sourceLangCode);
  return results[0] ?? "";
}

/**
 * Translate multiple texts in a single request (efficient — one round trip).
 * Returns results in the same order as inputs.
 */
export async function translateBatch(
  texts: string[],
  targetLangCode: string,
  sourceLangCode?: string
): Promise<string[]> {
  if (texts.every((t) => !t.trim())) return texts.map(() => "");
  return callTranslateAPI(texts, targetLangCode, sourceLangCode);
}

/**
 * Legacy shim — keeps existing fi↔en translate button calls working.
 */
export async function translate(
  text: string,
  from: "fi" | "en",
  to: "fi" | "en"
): Promise<string> {
  return translateText(text, to, from);
}
