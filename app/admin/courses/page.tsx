import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = createServiceClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, status, duration, pricing")
    .order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Courses</h1>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          New Course
        </Link>
      </div>

      {courses && courses.length > 0 ? (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Name", "Duration", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{course.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{course.duration ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      course.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/courses/${course.id}`} className="text-xs text-primary hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No courses yet. <Link href="/admin/courses/new" className="text-primary hover:underline">Add your first course.</Link>
        </p>
      )}
    </div>
  );
}
