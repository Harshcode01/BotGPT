import { GoogleGenAI } from "@google/genai";
import { Redis } from "@upstash/redis";

export const config = { maxDuration: 30 };

const MODELS = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash-lite"];
const LIMIT = 5;
const MAX_HISTORY = 20;
const MAX_CHARS = 4000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const getIp = (req) =>
  (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
  req.socket?.remoteAddress ||
  "unknown";

const isOverloaded = (err) =>
  /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(
    `${err?.status ?? ""} ${err?.message ?? ""}`,
  );

export default async function handler(req, res) {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "failed" });
  }

  const key = `trial:${getIp(req)}`;

  try {
    // Lets the page show the real remaining count on load.
    if (req.method === "GET") {
      const used = Number(await redis.get(key)) || 0;
      return res.status(200).json({ remaining: Math.max(0, LIMIT - used) });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "failed" });
    }

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

    const used = await redis.incr(key);
    if (used > LIMIT) {
      await redis.decr(key);
      return res.status(429).json({ error: "trial_exhausted", remaining: 0 });
    }

    const contents = [...history, { role: "user", parts: [{ text: message }] }];
    let lastError;

    for (const model of MODELS) {
      try {
        const response = await ai.models.generateContent({ model, contents });
        return res.status(200).json({
          text: response.text || "_No response was generated._",
          remaining: Math.max(0, LIMIT - used),
        });
      } catch (err) {
        lastError = err;
        console.error(`[${model}]`, err?.message);
        if (!isOverloaded(err)) break;
      }
    }

    // The request failed, so give the message back.
    await redis.decr(key);
    return res
      .status(isOverloaded(lastError) ? 503 : 500)
      .json({
        error: isOverloaded(lastError) ? "busy" : "failed",
        remaining: Math.max(0, LIMIT - (used - 1)),
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "failed" });
  }
}