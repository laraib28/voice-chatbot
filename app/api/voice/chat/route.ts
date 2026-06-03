import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createServiceClient } from "@/lib/supabase/server";
import { runAgent, type Message } from "@/lib/ai/agent";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { detectLanguage } from "@/lib/utils/language";

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  let sessionId: string | null = null;
  let language: string | null = null;

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    sessionId = formData.get("sessionId") as string | null;
    language = formData.get("language") as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    console.log("[voice/chat] transcribing audio, size:", audioFile.size);

    // Step 1: Transcribe audio with Whisper
    // Whisper: use Urdu language hint for both Urdu script and Roman Urdu
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "ur",  // Urdu/Roman Urdu speakers — Whisper handles both
    });

    const userText = transcription.text.trim();
    console.log("[voice/chat] transcribed:", userText);

    if (!userText) {
      return NextResponse.json({ error: "Could not hear anything. Please speak clearly." }, { status: 422 });
    }

    // Step 2: Get AI response (reuse chat agent)
    const supabase = createServiceClient();

    // Always detect from current transcribed text
    const detectedLanguage = detectLanguage(userText);

    const { data: existingSession } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .single();

    if (!existingSession) {
      await supabase.from("chat_sessions").insert({
        id: sessionId,
        detected_language: detectedLanguage,
        channel: "voice",
        user_agent: request.headers.get("user-agent") ?? null,
      });
    }

    const { data: historyRows } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(20);

    const history: Message[] = (historyRows ?? []).map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));

    const systemPrompt = await buildSystemPrompt(detectedLanguage);
    const agentResponse = await runAgent(systemPrompt, history, userText);
    console.log("[voice/chat] agent replied");

    // Step 3: Convert reply to speech
    const ttsResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: agentResponse.reply,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());

    // Persist messages
    await supabase.from("chat_messages").insert([
      { session_id: sessionId, role: "user", content: userText },
      { session_id: sessionId, role: "assistant", content: agentResponse.reply },
    ]);

    // Return transcript + reply text + audio as base64
    return NextResponse.json({
      transcript: userText,
      reply: agentResponse.reply,
      audio: audioBuffer.toString("base64"),
      detectedLanguage,
    });
  } catch (err) {
    console.error("[voice/chat] error:", err);
    return NextResponse.json(
      { error: "Voice processing failed. Please try again." },
      { status: 500 }
    );
  }
}
