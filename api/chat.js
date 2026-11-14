import { GoogleGenAI } from "@google/genai";

export const config = { maxDuration: 60 };

const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"];
const MAX_HISTORY = 20;
const MAX_CHARS = 4000;
const MODEL_TIMEOUT_MS = 15000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Errors worth retrying on the next model: overloaded or timed out.
const isRetryable = (err) =>
  /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|abort|timeout|timed out|DEADLINE_EXCEEDED/i.test(
    `${err?.name ?? ""} ${err?.status ?? ""} ${err?.message ?? ""}`,
  );

export default async function handler(req, res) {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "failed" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "failed" });
  }

  try {
    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > MAX_CHARS) {
      return res.status(400).json({ error: "failed" });
    }

    const history = (Array.isArray(body.history) ? body.history : [])
      .filter(
        (m) =>
          (m?.role === "user" || m?.role === "model") &&
          typeof m?.text === "string" &&
          m.text.trim(),
      )
      .slice(-MAX_HISTORY)
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.text.slice(0, MAX_CHARS) }],
      }));

    const contents = [...history, { role: "user", parts: [{ text: message }] }];
    let lastError;

    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: { httpOptions: { timeout: MODEL_TIMEOUT_MS } },
        });
        return res.status(200).json({
          text: response.text || "_No response was generated._",
        });
      } catch (err) {
        lastError = err;
        console.error(`[${model}]`, err?.name, err?.message);
        if (!isRetryable(err)) break;
      }
    }

    return res
      .status(isRetryable(lastError) ? 503 : 500)
      .json({ error: isRetryable(lastError) ? "busy" : "failed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed" });
  }
}