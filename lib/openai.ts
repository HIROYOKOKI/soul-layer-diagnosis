import OpenAI from "openai"
let cached: OpenAI | null = null
export function getOpenAI(): OpenAI | null {
  if (cached) return cached
  const k = process.env.OPENAI_API_KEY
  if (!k) return null
  cached = new OpenAI({ apiKey: k })
  return cached
}
