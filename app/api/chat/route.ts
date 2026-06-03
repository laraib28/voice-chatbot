import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runAgent, type Message } from "@/lib/ai/agent";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { detectLanguage } from "@/lib/utils/language";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: { message?: string; sessionId?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST", message: "Invalid JSON" }, { status: 400 });
  }

  const { message, sessionId, language } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "message is required and must be non-empty" },
      { status: 400 }
    );
  }

  if (message.length > 2000) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "message must be 2000 characters or fewer" },
      { status: 400 }
    );
  }

  if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "sessionId must be a valid UUID v4" },
      { status: 400 }
    );
  }

  console.log("[chat] request received, sessionId:", sessionId);

  const supabase = createServiceClient();

  console.log("[chat] querying chat_sessions...");
  const { data: existingSession, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("id, detected_language")
    .eq("id", sessionId)
    .single();
  console.log("[chat] session result:", existingSession?.id ?? "not found", sessionError?.message ?? "no error");

  let detectedLanguage: string = language ?? "en";

  // Always detect from current message so each reply matches user's current language
  detectedLanguage = detectLanguage(message);

  if (!existingSession) {
    await supabase.from("chat_sessions").insert({
      id: sessionId,
      detected_language: detectedLanguage,
      channel: "text",
      user_agent: request.headers.get("user-agent") ?? null,
    });
  }

  // Load recent conversation history (last 20 messages)
  const { data: historyRows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(20);

  const history: Message[] = (historyRows ?? []).map((row) => ({
    role: row.role as "user" | "assistant",
    content: row.content,
  }));

  console.log("[chat] building system prompt, lang:", detectedLanguage);
  const systemPrompt = await buildSystemPrompt(detectedLanguage);

  console.log("[chat] running agent for session:", sessionId);
  let agentResponse: { reply: string; toolCallsMade: string[] };
  try {
    agentResponse = await runAgent(systemPrompt, history, message.trim());
    console.log("[chat] agent done, tools used:", agentResponse.toolCallsMade);
  } catch (err) {
    console.error("[chat/route] Agent error:", err);
    return NextResponse.json(
      { error: "AGENT_ERROR", message: "The assistant is temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }

  // Persist messages
  await supabase.from("chat_messages").insert([
    { session_id: sessionId, role: "user", content: message.trim() },
    { session_id: sessionId, role: "assistant", content: agentResponse.reply },
  ]);

  return NextResponse.json({
    reply: agentResponse.reply,
    detectedLanguage,
    sessionId,
  });
}
