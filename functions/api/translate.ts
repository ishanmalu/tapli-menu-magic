interface Env {
  DEEPL_API_KEY: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export const onRequestOptions = () =>
  new Response(null, { status: 204, headers: CORS });

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { texts, targetLang, sourceLang } = await context.request.json() as {
      texts: string[];
      targetLang: string;
      sourceLang?: string;
    };

    if (!texts?.length || !targetLang) {
      return new Response(
        JSON.stringify({ error: "texts and targetLang are required" }),
        { status: 400, headers: CORS }
      );
    }

    const apiKey = context.env.DEEPL_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "DEEPL_API_KEY not configured in Cloudflare environment variables" }),
        { status: 500, headers: CORS }
      );
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
      return new Response(
        JSON.stringify({ error: `DeepL error ${deeplRes.status}: ${err}` }),
        { status: deeplRes.status, headers: CORS }
      );
    }

    const data = await deeplRes.json() as { translations: { text: string }[] };
    const translations = data.translations.map((t) => t.text);

    return new Response(JSON.stringify({ translations }), { headers: CORS });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: CORS }
    );
  }
}
