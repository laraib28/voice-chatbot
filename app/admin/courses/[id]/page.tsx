import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import EditCourseClient from "@/components/admin/EditCourseClient";
import BatchForm from "@/components/admin/BatchForm";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EditCoursePage({ params }: Props) {
  const supabase = createServiceClient();

  const [{ data: course }, { data: batches }] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .eq("id", params.id)
      .single(),
    supabase
      .from("course_batches")
      .select("*")
      .eq("course_id", params.id)
      .order("start_date", { ascending: true }),
  ]);

  if (!course) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Edit Course</h1>
        <p className="text-sm text-muted-foreground mt-1">{course.name}</p>
      </div>

      <div className="rounded-md border border-border p-6">
        <EditCourseClient course={course} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Batches</h2>
        </div>

        {batches && batches.length > 0 ? (
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["Dates", "Capacity", "Location", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs">
                      {b.start_date ? format(new Date(b.start_date), "MMM d, yyyy") : "—"}
                      {" → "}
                      {b.end_date ? format(new Date(b.end_date), "MMM d, yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{b.capacity ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.location ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.status === "ongoing"
                            ? "bg-green-100 text-green-700"
                            : b.status === "upcoming"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">No batches yet.</p>
        )}

        <div className="rounded-md border border-border p-6">
          <h3 className="text-sm font-medium mb-4">Add Batch</h3>
          <BatchForm courseId={params.id} />
        </div>
      </div>
    </div>
  );
}
