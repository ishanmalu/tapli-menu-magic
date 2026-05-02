import { ALL_LANGUAGES } from "@/constants/languages";

const API_KEY = import.meta.env.VITE_DEEPL_API_KEY as string | undefined;

// Free-tier keys end with :fx and use a different host
const BASE_URL = API_KEY?.endsWith(":fx")
  ? "https://api-free.deepl.com/v2"
  : "https://api.deepl.com/v2";

/**
 * Translate a single piece of text using DeepL.
 * targetLangCode is the internal code (e.g. "sv", "de", "fi", "en").
 * sourceLangCode is optional — DeepL auto-detects if omitted.
 */
export async function translateText(
  text: string,
  targetLangCode: string,
  sourceLangCode?: string
): Promise<string> {
  if (!text.trim()) return "";
  if (!API_KEY) throw new Error("DeepL API key not configured");

  const lang = ALL_LANGUAGES.find((l) => l.code === targetLangCode);
  if (!lang) throw new Error(`Unknown language: ${targetLangCode}`);

  const body: Record<string, unknown> = {
    text: [text],
    target_lang: lang.deeplCode,
  };

  if (sourceLangCode) {
    const src = ALL_LANGUAGES.find((l) => l.code === sourceLangCode);
    if (src) body.source_lang = src.deeplCode.split("-")[0]; // DeepL source doesn't use region
  }

  const res = await fetch(`${BASE_URL}/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepL error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return (json.translations?.[0]?.text as string) ?? "";
}

/**
 * Translate multiple texts in a single DeepL request (more efficient).
 * Returns results in the same order as inputs.
 */
export async function translateBatch(
  texts: string[],
  targetLangCode: string,
  sourceLangCode?: string
): Promise<string[]> {
  const nonEmpty = texts.filter((t) => t.trim());
  if (nonEmpty.length === 0) return texts.map(() => "");
  if (!API_KEY) throw new Error("DeepL API key not configured");

  const lang = ALL_LANGUAGES.find((l) => l.code === targetLangCode);
  if (!lang) throw new Error(`Unknown language: ${targetLangCode}`);

  const body: Record<string, unknown> = {
    text: texts,
    target_lang: lang.deeplCode,
  };

  if (sourceLangCode) {
    const src = ALL_LANGUAGES.find((l) => l.code === sourceLangCode);
    if (src) body.source_lang = src.deeplCode.split("-")[0];
  }

  const res = await fetch(`${BASE_URL}/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepL error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return (json.translations as { text: string }[]).map((t) => t.text);
}

/**
 * Legacy shim — keeps existing fi↔en calls working unchanged.
 */
export async function translate(
  text: string,
  from: "fi" | "en",
  to: "fi" | "en"
): Promise<string> {
  return translateText(text, to, from);
}
