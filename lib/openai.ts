// lib/openai.ts
import OpenAI from "openai";

let _oa: OpenAI | null = null;

export function getOpenAI() {
  const key =
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_APIKEY ||
    process.env.OPENAI_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is missing on server runtime");
  }
  if (!_oa) _oa = new OpenAI({ apiKey: key });
  return _oa;
}
