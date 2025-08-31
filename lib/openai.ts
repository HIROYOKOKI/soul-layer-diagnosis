import OpenAI from "openai"

let client: OpenAI | null = null
export function getOpenAI() {
  if (!client) {
    const key = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!key) throw new Error("OPENAI_API_KEY missing")
    client = new OpenAI({ apiKey: key })
  }
  return client
}
