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

interface AnnouncementFormProps {
  courses: Course[];
  initialData?: {
    id?: string;
    title?: string;
    body?: string;
    course_id?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active?: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AnnouncementForm({ courses, initialData, onSuccess, onCancel }: AnnouncementFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    body: initialData?.body ?? "",
    course_id: initialData?.course_id ?? "all",
    starts_at: initialData?.starts_at?.slice(0, 10) ?? "",
    ends_at: initialData?.ends_at?.slice(0, 10) ?? "",
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
      title: form.title,
      body: form.body,
      course_id: form.course_id === "all" ? null : form.course_id,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      is_active: form.is_active,
    };

    try {
      const url = isEdit
        ? `/api/admin/announcements/${initialData!.id}`
        : "/api/admin/announcements";
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
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          required
          placeholder="e.g. New batch starting in July"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Body *</Label>
        <Textarea
          id="body"
          required
          rows={4}
          placeholder="Announcement details…"
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="starts_at">Start Date</Label>
          <Input
            id="starts_at"
            type="date"
            value={form.starts_at}
            onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ends_at">End Date</Label>
          <Input
            id="ends_at"
            type="date"
            value={form.ends_at}
            onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
          />
        </div>
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
          {loading ? "Saving…" : isEdit ? "Update Announcement" : "Add Announcement"}
        </Button>
      </div>
    </form>
  );
}
