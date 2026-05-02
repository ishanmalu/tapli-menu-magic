import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { texts, targetLang, sourceLang } = await req.json() as {
      texts: string[];
      targetLang: string;   // DeepL target_lang code e.g. "SV", "DE", "EN-GB"
      sourceLang?: string;  // optional e.g. "FI", "EN"
    };

    if (!texts?.length || !targetLang) {
      return new Response(JSON.stringify({ error: "texts and targetLang are required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("DEEPL_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "DEEPL_API_KEY not configured" }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";

    const body: Record<string, unknown> = { text: texts, target_lang: targetLang };
    if (sourceLang) body.source_lang = sourceLang;

    const deeplRes = await fetch(`https://${host}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!deeplRes.ok) {
      const err = await deeplRes.text();
      return new Response(JSON.stringify({ error: `DeepL error ${deeplRes.status}: ${err}` }), {
        status: deeplRes.status, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const data = await deeplRes.json();
    const translations = (data.translations as { text: string }[]).map((t) => t.text);

    return new Response(JSON.stringify({ translations }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
