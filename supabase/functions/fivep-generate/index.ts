import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.131.0";

/* 5 Pollar (kolbenarenji.com/5p): writes the pillar texts with the site's own
   Anthropic key. Only signed-in admins (public.is_admin()) may call it, so the
   key cannot be spent by visitors; visitors use their own key in the browser.
   The key is read from app_config (anthropic_api_key) like the other functions
   and never leaves the server. Every call is logged in ai_usage_log. */

const SB_URL = Deno.env.get("SUPABASE_URL") || "";
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const MODEL = "claude-opus-5-5";
const PRICE_IN = 4 / 1e6, PRICE_OUT = 20 / 1e6; // USD per token
const MAX_PROMPT = 200_000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function isAdmin(authHeader: string): Promise<boolean> {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: { apikey: SB_ANON, Authorization: authHeader, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) return false;
  return (await res.json().catch(() => false)) === true;
}

async function anthropicKey(): Promise<string> {
  const res = await fetch(`${SB_URL}/rest/v1/app_config?select=value&key=eq.anthropic_api_key`, {
    headers: { apikey: SB_SERVICE, Authorization: "Bearer " + SB_SERVICE },
  });
  if (!res.ok) return "";
  const rows = await res.json().catch(() => []);
  return rows?.[0]?.value || "";
}

async function logUsage(tokensIn: number, tokensOut: number) {
  await fetch(`${SB_URL}/rest/v1/ai_usage_log`, {
    method: "POST",
    headers: { apikey: SB_SERVICE, Authorization: "Bearer " + SB_SERVICE, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_usd: Math.round((tokensIn * PRICE_IN + tokensOut * PRICE_OUT) * 10000) / 10000,
      purpose: "5p",
    }),
  }).catch(() => {});
}

// The page asks for JSON in the prompt; take the outermost object from the answer.
function extractJson(text: string): unknown {
  const t = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(t.slice(a, b + 1)); } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { code: "method", message: "POST only" });

  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ") || !(await isAdmin(auth))) {
    return json(403, { code: "not_admin", message: "فقط مدیر واردشده می‌تواند از کلید سایت استفاده کند." });
  }

  const body = await req.json().catch(() => ({}));
  const prompt = typeof body?.prompt === "string" ? body.prompt : "";
  if (!prompt.trim()) return json(400, { code: "bad_request", message: "متن درخواست خالی است." });
  if (prompt.length > MAX_PROMPT) return json(413, { code: "prompt_too_large", message: "درخواست خیلی بزرگ است." });

  const apiKey = await anthropicKey();
  if (!apiKey) return json(500, { code: "no_key", message: "کلید API در app_config ثبت نشده است." });

  const client = new Anthropic({ apiKey });
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: prompt }],
    });
    const msg = await stream.finalMessage();
    await logUsage(msg.usage.input_tokens ?? 0, msg.usage.output_tokens ?? 0);
    if (msg.stop_reason === "refusal") return json(422, { code: "refused", message: "Claude به این درخواست پاسخ نداد." });
    if (msg.stop_reason === "max_tokens") return json(502, { code: "invalid_json", message: "پاسخ ناقص ماند. دوباره امتحان کنید." });
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const data = extractJson(text);
    if (data === null) return json(502, { code: "invalid_json", message: "پاسخ Claude قابل خواندن نبود." });
    return json(200, { data });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json(502, { code: "auth", message: "کلید API سایت معتبر نیست." });
    if (e instanceof Anthropic.RateLimitError) return json(429, { code: "rate_limited", message: "درخواست‌ها زیاد شد." });
    if (e instanceof Anthropic.APIError) return json(502, { code: "api_error", message: `خطای Claude API (${e.status ?? "شبکه"})` });
    console.error("fivep-generate:", String(e));
    return json(500, { code: "server_error", message: "خطای سرور." });
  }
});
