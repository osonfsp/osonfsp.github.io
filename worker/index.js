// FSP Deutsch AI proxy: sayt (GitHub Pages) shu yerga so'rov yuboradi, Worker esa Gemini'ga
// yashirin kalit bilan uzatadi. Kalit brauzerga hech qachon chiqmaydi.
//
// Sozlamalar (Cloudflare):
//   GEMINI_API_KEY  — secret: `npx wrangler secret put GEMINI_API_KEY`
//   GEMINI_MODELS   — wrangler.toml [vars], vergul bilan: birinchisi asosiy, qolganlari zaxira
//   ALLOWED_ORIGINS — vergul bilan ajratilgan saytlar ro'yxati
//   LIMITER         — rate limit binding (bir IP uchun daqiqasiga N so'rov)

const MAX_BODY = 60_000;

export default {
  async fetch(req, env) {
    let origin = req.headers.get("Origin") || "",
      allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()),
      cors = {
        "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] || "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      },
      reply = (status, data) =>
        new Response(JSON.stringify(data), {
          status,
          headers: { ...cors, "Content-Type": "application/json" },
        });

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST") return reply(405, { error: "method" });
    if (!allowed.includes(origin)) return reply(403, { error: "origin" });

    if (env.LIMITER) {
      let ip = req.headers.get("CF-Connecting-IP") || "unknown",
        { success } = await env.LIMITER.limit({ key: ip });
      if (!success) return reply(429, { error: "rate_limited" });
    }

    let raw = await req.text();
    if (raw.length > MAX_BODY) return reply(413, { error: "too_large" });
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return reply(400, { error: "bad_json" });
    }
    let messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length) return reply(400, { error: "no_messages" });

    let contents = messages.slice(-30).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "").slice(0, 15_000) }],
    }));

    let models = (env.GEMINI_MODELS || "gemini-flash-lite-latest").split(",").map((m) => m.trim()),
      payload = JSON.stringify({
        contents,
        generationConfig: {
          temperature: body.json ? 0.3 : 0.8,
          ...(body.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
      res = null;

    // Bepul tarifda Google ba'zan band (503) yoki sekin: har urinishga 12 s, keyin keyingi model
    for (let i = 0; i < models.length * 2 && !res?.ok; i++) {
      let model = models[i % models.length];
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
            body: payload,
            signal: AbortSignal.timeout(12_000),
          },
        );
        if (!res.ok) console.log("gemini", model, res.status, (await res.clone().text()).slice(0, 200));
      } catch (e) {
        console.log("gemini", model, e.name);
        res = null;
      }
    }
    if (!res?.ok)
      return reply(res?.status === 429 ? 429 : 502, { error: "upstream", status: res?.status ?? 0 });
    let data = await res.json(),
      text = (data.candidates?.[0]?.content?.parts || [])
        .filter((p) => !p.thought)
        .map((p) => p.text || "")
        .join("")
        .trim();
    if (!text) return reply(502, { error: "empty" });
    return reply(200, { text });
  },
};
