import { NextRequest, NextResponse } from "next/server";
import { buildVoiceSessionInstructions } from "@/lib/ai/prompts";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
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

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many voice session requests." },
      { status: 429 }
    );
  }

  let body: { sessionId?: string; language?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST", message: "Invalid JSON" }, { status: 400 });
  }

  const { sessionId, language } = body;

  if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "sessionId must be a valid UUID v4" },
      { status: 400 }
    );
  }

  const instructions = buildVoiceSessionInstructions(language);
  console.log("[voice/session] Requesting ephemeral token from OpenAI...");

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions,
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    console.log("[voice/session] OpenAI responded:", response.status);
    if (!response.ok) {
      const err = await response.text();
      console.error("[voice/session] OpenAI error:", response.status, err);
      return NextResponse.json(
        { error: "TOKEN_CREATION_FAILED", message: "Voice session unavailable. Please use text chat." },
        { status: 500 }
      );
    }

    const session = (await response.json()) as {
      id: string;
      client_secret: { value: string; expires_at: number };
    };

    return NextResponse.json({
      ephemeralToken: session.client_secret.value,
      expiresAt: new Date(session.client_secret.expires_at * 1000).toISOString(),
      realtimeUrl: "wss://api.openai.com/v1/realtime",
      sessionConfig: {
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions,
      },
    });
  } catch (err) {
    console.error("[voice/session] Unexpected error:", err);
    return NextResponse.json(
      { error: "TOKEN_CREATION_FAILED", message: "Voice session unavailable. Please use text chat." },
      { status: 500 }
    );
  }
}
