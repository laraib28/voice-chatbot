"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface CourseFormData {
  name: string;
  description: string;
  duration: string;
  target_audience: string;
  prerequisites: string;
  pricing: string;
  status: "active" | "archived";
}

interface CourseFormProps {
  initial?: Partial<CourseFormData>;
  onSubmit: (data: CourseFormData) => Promise<void>;
  isLoading?: boolean;
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export default function CourseForm({
  initial,
  onSubmit,
  isLoading,
}: CourseFormProps) {
  const [form, setForm] = useState<CourseFormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    duration: initial?.duration ?? "",
    target_audience: initial?.target_audience ?? "",
    prerequisites: initial?.prerequisites ?? "",
    pricing: initial?.pricing ?? "",
    status: initial?.status ?? "active",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Course name is required.");
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function field(
    label: string,
    key: keyof CourseFormData,
    opts?: { type?: string; multiline?: boolean; hint?: string }
  ) {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium">{label}</label>
        {opts?.multiline ? (
          <textarea
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            disabled={isLoading}
            rows={3}
            className={cn(inputClass, "resize-none")}
          />
        ) : (
          <input
            type={opts?.type ?? "text"}
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            disabled={isLoading}
            className={inputClass}
          />
        )}
        {opts?.hint && (
          <p className="text-xs text-muted-foreground">{opts.hint}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {field("Course Name *", "name")}
      {field("Description", "description", { multiline: true })}
      {field("Duration", "duration", { hint: 'e.g. "8 weeks" or "3 days"' })}
      {field("Target Audience", "target_audience")}
      {field("Prerequisites", "prerequisites")}
      {field("Pricing (PKR)", "pricing", { type: "number" })}

      <div className="space-y-1">
        <label className="text-sm font-medium">Status</label>
        <select
          value={form.status}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              status: e.target.value as "active" | "archived",
            }))
          }
          disabled={isLoading}
          className={inputClass}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isLoading ? "Saving…" : "Save Course"}
      </button>
    </form>
  );
}
