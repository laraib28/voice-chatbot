"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface VoiceButtonProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function VoiceButton({
  isActive,
  onToggle,
  disabled,
}: VoiceButtonProps) {
  const [permissionDenied, setPermissionDenied] = useState(false);

  async function handleClick() {
    if (!isActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermissionDenied(false);
      } catch {
        setPermissionDenied(true);
        return;
      }
    }

    onToggle();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={
          permissionDenied
            ? "Microphone access denied — click to retry"
            : isActive
              ? "Stop voice input"
              : "Start voice input"
        }
        title={
          permissionDenied
            ? "Microphone was denied. Allow mic in browser settings then click again."
            : isActive
              ? "Stop voice"
              : "Start voice"
        }
        className={cn(
          "rounded-xl p-2 transition-colors disabled:opacity-40",
          isActive
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "border border-input bg-background text-foreground hover:bg-accent"
        )}
      >
        {isActive ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
