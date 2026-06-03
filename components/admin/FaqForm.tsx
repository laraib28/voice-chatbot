"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Course {
  id: string;
  name: string;
}

interface FaqFormProps {
  courses: Course[];
  initialData?: {
    id?: string;
    question?: string;
    answer?: string;
    course_id?: string | null;
    order_index?: number;
    is_active?: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FaqForm({ courses, initialData, onSuccess, onCancel }: FaqFormProps) {
  const [form, setForm] = useState({
    question: initialData?.question ?? "",
    answer: initialData?.answer ?? "",
    course_id: initialData?.course_id ?? "all",
    order_index: initialData?.order_index?.toString() ?? "0",
    is_active: initialData?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initialData?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      question: form.question,
      answer: form.answer,
      course_id: form.course_id === "all" ? null : form.course_id,
      order_index: parseInt(form.order_index, 10) || 0,
      is_active: form.is_active,
    };

    try {
      const url = isEdit ? `/api/admin/faqs/${initialData!.id}` : "/api/admin/faqs";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Request failed");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="question">Question *</Label>
        <Input
          id="question"
          required
          placeholder="e.g. What is included in the Python course?"
          value={form.question}
          onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="answer">Answer *</Label>
        <Textarea
          id="answer"
          required
          rows={4}
          placeholder="Provide a clear, concise answer…"
          value={form.answer}
          onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="course_id">Course</Label>
        <Select
          value={form.course_id}
          onValueChange={(v) => setForm((f) => ({ ...f, course_id: v }))}
        >
          <SelectTrigger id="course_id">
            <SelectValue placeholder="All courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="order_index">Display Order</Label>
        <Input
          id="order_index"
          type="number"
          min={0}
          value={form.order_index}
          onChange={(e) => setForm((f) => ({ ...f, order_index: e.target.value }))}
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="is_active"
          checked={form.is_active}
          onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Update FAQ" : "Add FAQ"}
        </Button>
      </div>
    </form>
  );
}
