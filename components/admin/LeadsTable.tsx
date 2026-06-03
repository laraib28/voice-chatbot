"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  interested_course: string | null;
  consent_given: boolean;
  created_at: string;
}

interface LeadsTableProps {
  leads: Lead[];
  onDelete: (id: string) => Promise<void>;
}

export default function LeadsTable({ leads, onDelete }: LeadsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this lead? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  if (leads.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No leads captured yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {["Name", "Phone", "Email", "Interested Course", "Date", ""].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">{lead.name ?? "—"}</td>
              <td className="px-4 py-3">{lead.phone ?? "—"}</td>
              <td className="px-4 py-3">{lead.email ?? "—"}</td>
              <td className="px-4 py-3">{lead.interested_course ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {format(new Date(lead.created_at), "MMM d, yyyy HH:mm")}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(lead.id)}
                  disabled={deletingId === lead.id}
                  aria-label="Delete lead"
                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
