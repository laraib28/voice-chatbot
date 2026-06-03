"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import MessageList, { type ChatMessage } from "./MessageList";
import MessageInput from "./MessageInput";
import LanguageIndicator from "./LanguageIndicator";
import VoiceButton from "@/components/voice/VoiceButton";
import VoiceSession, { type VoiceTranscript } from "@/components/voice/VoiceSession";
import AudioVisualizer from "@/components/voice/AudioVisualizer";

const SESSION_ID_KEY = "ai_chat_session_id";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuidv4();
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export default function ChatInterface() {
  const [sessionId] = useState(getOrCreateSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceConnecting, setVoiceConnecting] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = { id: uuidv4(), role: "user", content };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setVoiceError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            sessionId,
            language: detectedLanguage ?? undefined,
          }),
        });

        const data = (await res.json()) as {
          reply?: string;
          detectedLanguage?: string;
          error?: string;
          message?: string;
        };

        if (!res.ok) {
          const errMsg: ChatMessage = {
            id: uuidv4(),
            role: "assistant",
            content: data.message ?? "Something went wrong. Please try again.",
          };
          setMessages((prev) => [...prev, errMsg]);
          return;
        }

        if (data.detectedLanguage && !detectedLanguage) {
          setDetectedLanguage(data.detectedLanguage);
        }

        const assistantMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: data.reply ?? "",
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errMsg: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, detectedLanguage]
  );

  const handleVoiceTranscript = useCallback(
    (transcript: VoiceTranscript) => {
      const msg: ChatMessage = {
        id: transcript.id,
        role: transcript.role,
        content: transcript.content,
      };
      setMessages((prev) => [...prev, msg]);
    },
    []
  );

  const handleVoiceError = useCallback((message: string) => {
    setVoiceError(message);
    setIsVoiceActive(false);
    setVoiceConnecting(false);
    setVoiceProcessing(false);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white z-10">
        <Image
          src="/logo-khawajgan.png"
          alt="Tanzeem-e-Khawajgan"
          width={40}
          height={40}
          className="rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-slate-800 leading-tight">Tanzeem-e-Khawajgan</h1>
          <p className="text-xs text-slate-500 leading-tight">Khawaja Bot</p>
        </div>
        <LanguageIndicator language={detectedLanguage} />
      </div>

      {/* Voice status banners */}
      {isVoiceActive && !voiceProcessing && !voiceError && (
        <div className="px-4 py-2 bg-blue-50 text-blue-700 text-xs border-b border-blue-100 text-center">
          🎙️ Recording… mic button dobara dabao jab baat khatam ho.
        </div>
      )}
      {voiceProcessing && (
        <div className="px-4 py-2 bg-amber-50 text-amber-700 text-xs border-b border-amber-100 text-center animate-pulse">
          ⏳ Processing…
        </div>
      )}
      {voiceError && (
        <div
          className="px-4 py-2 bg-red-50 text-red-600 text-xs border-b border-red-100 text-center cursor-pointer"
          onClick={() => setVoiceError(null)}
        >
          {voiceError} — tap to dismiss
        </div>
      )}

      {/* Voice session */}
      <VoiceSession
        sessionId={sessionId}
        language={detectedLanguage ?? undefined}
        isActive={isVoiceActive}
        onTranscript={handleVoiceTranscript}
        onError={handleVoiceError}
        onConnected={() => setVoiceConnecting(false)}
        onProcessing={setVoiceProcessing}
      />

      {/* Messages — scrollable, full width, centered content */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input bar — pinned at bottom, centered like ChatGPT */}
      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex items-center gap-1 flex-shrink-0">
            {isVoiceActive && <AudioVisualizer isActive={isVoiceActive} />}
            <VoiceButton
              isActive={isVoiceActive}
              onToggle={() => {
                setVoiceError(null);
                setVoiceConnecting(false);
                setIsVoiceActive((v) => !v);
              }}
              disabled={isLoading}
            />
          </div>
          <div className="flex-1">
            <MessageInput
              onSend={sendMessage}
              disabled={isLoading || isVoiceActive}
              placeholder={isVoiceActive ? "🎙️ Voice mode active…" : "Khawaja Bot se poochein…"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
