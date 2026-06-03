"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BatchFormProps {
  courseId: string;
  initialData?: {
    id?: string;
    start_date?: string;
    end_date?: string;
    capacity?: number;
    location?: string;
    status?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BatchForm({ courseId, initialData, onSuccess, onCancel }: BatchFormProps) {
  const [form, setForm] = useState({
    start_date: initialData?.start_date?.slice(0, 10) ?? "",
    end_date: initialData?.end_date?.slice(0, 10) ?? "",
    capacity: initialData?.capacity?.toString() ?? "",
    location: initialData?.location ?? "",
    status: initialData?.status ?? "upcoming",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(initialData?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      start_date: form.start_date,
      end_date: form.end_date,
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      location: form.location || null,
      status: form.status,
    };

    try {
      const url = isEdit
        ? `/api/admin/batches/${initialData!.id}`
        : `/api/admin/courses/${courseId}/batches`;
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            required
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End Date *</Label>
          <Input
            id="end_date"
            type="date"
            required
            value={form.end_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          type="number"
          min={1}
          placeholder="e.g. 30"
          value={form.capacity}
          onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="e.g. Room 101 / Online"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Update Batch" : "Add Batch"}
        </Button>
      </div>
    </form>
  );
}
