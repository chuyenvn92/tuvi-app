const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

interface GeminiConfig {
  temperature?: number;
  maxOutputTokens?: number;
}

export async function callGemini(
  systemPrompt: string,
  contents: GeminiContent[],
  config: GeminiConfig = {}
): Promise<string> {
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: config.temperature ?? 0.8,
      maxOutputTokens: config.maxOutputTokens ?? 1024,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  let lastError = "";
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok) {
        lastError = data?.error?.message ?? "Unknown error";
        // Chỉ thử model tiếp theo nếu lỗi overload/quota
        if (res.status === 503 || res.status === 429 || lastError.includes("quota") || lastError.includes("demand")) continue;
        throw new Error(lastError);
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      if (!lastError.includes("quota") && !lastError.includes("demand") && !lastError.includes("503")) throw e;
    }
  }
  throw new Error(lastError || "Không thể kết nối AI lúc này.");
}
