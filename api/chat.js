import { GoogleGenAI } from "@google/genai";

export const config = { maxDuration: 30 };

const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"];
const MAX_HISTORY = 20;
const MAX_CHARS = 4000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const isOverloaded = (err) =>
  /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(
    `${err?.status ?? ""} ${err?.message ?? ""}`,
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
        const response = await ai.models.generateContent({ model, contents });
        return res.status(200).json({
          text: response.text || "_No response was generated._",
        });
      } catch (err) {
        lastError = err;
        console.error(`[${model}]`, err?.message);
        if (!isOverloaded(err)) break;
      }
    }

    return res
      .status(isOverloaded(lastError) ? 503 : 500)
      .json({ error: isOverloaded(lastError) ? "busy" : "failed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed" });
  }
}