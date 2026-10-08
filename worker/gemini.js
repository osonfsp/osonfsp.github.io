// Gemini so'rovi: asosiy model, band bo'lsa — zaxira modellar (GEMINI_MODELS), har urinishga vaqt chegarasi
export async function callGemini(env, contents, { json = false, tries, timeout = 12_000 } = {}) {
  let models = (env.GEMINI_MODELS || "gemini-flash-lite-latest").split(",").map((m) => m.trim()),
    payload = JSON.stringify({
      contents,
      generationConfig: {
        temperature: json ? 0.3 : 0.8,
        ...(json ? { responseMimeType: "application/json" } : {}),
      },
    }),
    res = null;

  // Bepul tarifda Google ba'zan band (503) yoki sekin: har urinishga 12 s, keyin keyingi model
  for (let i = 0; i < (tries ?? models.length * 2) && !res?.ok; i++) {
    let model = models[i % models.length];
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: payload,
        signal: AbortSignal.timeout(timeout),
      });
      if (!res.ok) console.log("gemini", model, res.status, (await res.clone().text()).slice(0, 200));
    } catch (e) {
      console.log("gemini", model, e.name);
      res = null;
    }
  }
  if (!res?.ok)
    return { status: res?.status === 429 ? 429 : 502, data: { error: "upstream", status: res?.status ?? 0 } };
  let data = await res.json(),
    text = (data.candidates?.[0]?.content?.parts || [])
      .filter((p) => !p.thought)
      .map((p) => p.text || "")
      .join("")
      .trim();
  return text ? { status: 200, data: { text } } : { status: 502, data: { error: "empty" } };
}
