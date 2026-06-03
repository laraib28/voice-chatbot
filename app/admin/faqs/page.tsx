import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const supabase = createServiceClient();
  const { data: faqs } = await supabase
    .from("faqs")
    .select("id, question, is_active, course_id, courses(name)")
    .order("order_index");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">FAQs</h1>
      </div>

      {faqs && faqs.length > 0 ? (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Question", "Course", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {faqs.map((faq) => (
                <tr key={faq.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 max-w-sm truncate">{faq.question}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(faq.courses as unknown as { name: string } | null)?.name ?? "Platform-wide"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      faq.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {faq.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">No FAQs yet.</p>
      )}
    </div>
  );
}
