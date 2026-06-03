"use client";

import { useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

export interface VoiceTranscript {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface VoiceSessionProps {
  sessionId: string;
  language?: string;
  isActive: boolean;
  onTranscript: (transcript: VoiceTranscript) => void;
  onError: (message: string) => void;
  onConnected?: () => void;
  onProcessing?: (processing: boolean) => void;
}

export default function VoiceSession({
  sessionId,
  language,
  isActive,
  onTranscript,
  onError,
  onConnected,
  onProcessing,
}: VoiceSessionProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      onProcessing?.(true);

      try {
        const formData = new FormData();
        // Whisper needs a filename with extension to detect format
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("sessionId", sessionId);
        if (language) formData.append("language", language);

        const res = await fetch("/api/voice/chat", {
          method: "POST",
          signal: AbortSignal.timeout(30000),
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          onError(data.error ?? "Voice processing failed.");
          return;
        }

        const data = await res.json() as {
          transcript: string;
          reply: string;
          audio: string;
          detectedLanguage: string;
        };

        // Show user transcript
        onTranscript({ id: uuidv4(), role: "user", content: data.transcript });
        // Show assistant reply
        onTranscript({ id: uuidv4(), role: "assistant", content: data.reply });

        // Play audio response via AudioContext (avoids autoplay block)
        const audioBytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
        const ctx = audioCtxRef.current ?? new AudioContext();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") await ctx.resume();
        const decoded = await ctx.decodeAudioData(audioBytes.buffer);
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        src.start();
      } catch (err) {
        if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
          onError("Voice timed out. Check your connection and try again.");
        } else {
          onError("Voice processing failed. Please try again.");
        }
        console.error("[VoiceSession] processAudio error:", err);
      } finally {
        isProcessingRef.current = false;
        onProcessing?.(false);
      }
    },
    [sessionId, language, onTranscript, onError]
  );

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Unlock AudioContext during user gesture so later playback isn't blocked
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      await audioCtxRef.current.resume();
      onConnected?.();

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        if (blob.size > 1000) {
          processAudio(blob);
        }
      };

      // Record in 8-second segments, auto-process each
      recorder.start();
      console.log("[VoiceSession] recording started");
    } catch {
      onError("Could not access microphone. Please allow mic access.");
    }
  }, [onConnected, onError, processAudio]);

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (isActive) {
      startRecording();
    } else {
      stopRecording();
    }
    return stopRecording;
  }, [isActive, startRecording]);

  return null;
}
