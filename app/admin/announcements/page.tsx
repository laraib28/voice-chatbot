import { createServiceClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const supabase = createServiceClient();
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, title, is_active, starts_at, ends_at, courses(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Announcements</h1>

      {announcements && announcements.length > 0 ? (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Title", "Course", "Dates", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {announcements.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(a.courses as unknown as { name: string } | null)?.name ?? "All"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {a.starts_at ? format(new Date(a.starts_at), "MMM d") : "Always"}{" "}
                    {a.ends_at ? `– ${format(new Date(a.ends_at), "MMM d")}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {a.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">No announcements yet.</p>
      )}
    </div>
  );
}
