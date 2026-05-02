import { supabase } from "@/integrations/supabase/client";
import { ALL_LANGUAGES } from "@/constants/languages";

// All translation requests go through our Supabase Edge Function
// so the DeepL API key stays server-side and CORS is never an issue.
// We use supabase.functions.invoke() so the URL + auth are handled
// automatically by the already-configured Supabase client.

async function callEdgeFunction(
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

  const { data, error } = await supabase.functions.invoke("translate", { body });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.translations as string[];
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
  const results = await callEdgeFunction([text], targetLangCode, sourceLangCode);
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
  return callEdgeFunction(texts, targetLangCode, sourceLangCode);
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
