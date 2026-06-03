import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

const supabase = () => createServiceClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withTimeout<T>(promise: PromiseLike<T>, ms = 15000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Supabase query timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function getCourses() {
  const { data, error } = await withTimeout(
    supabase()
      .from("courses")
      .select(
        `id, name, description, duration, target_audience, prerequisites, pricing, status,
         course_batches(id, start_date, end_date, capacity, enrolled_count, status, location)`
      )
      .eq("status", "active")
      .order("name")
  );

  console.log("[tools] getCourses:", data?.length ?? 0, "rows | error:", error?.message ?? "none");
  if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
  return data ?? [];
}

export async function getCourseDetails(courseId: string) {
  const { data, error } = await withTimeout(
    supabase()
      .from("courses")
      .select(
        `id, name, description, duration, target_audience, prerequisites, pricing, status,
         course_batches(id, start_date, end_date, capacity, enrolled_count, status, location, notes),
         faqs(id, question, answer, order_index)`
      )
      .eq("id", courseId)
      .single()
  );

  if (error) throw new Error(`Failed to fetch course details: ${error.message}`);
  return data;
}

export async function getFaqs(courseId?: string) {
  let query = supabase()
    .from("faqs")
    .select("id, question, answer, course_id, order_index")
    .eq("is_active", true)
    .order("order_index");

  if (courseId) {
    query = query.or(`course_id.eq.${courseId},course_id.is.null`);
  }

  const { data, error } = await withTimeout(query);
  if (error) throw new Error(`Failed to fetch FAQs: ${error.message}`);
  return data ?? [];
}

export async function getAnnouncements() {
  const now = new Date().toISOString();
  const { data, error } = await withTimeout(
    supabase()
      .from("announcements")
      .select("id, title, body, course_id, starts_at, ends_at")
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order("created_at", { ascending: false })
  );

  if (error) throw new Error(`Failed to fetch announcements: ${error.message}`);
  return data ?? [];
}

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const { data, error } = await withTimeout(
      supabase().from("settings").select("key, value")
    );
    if (error) return {};
    return Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));
  } catch {
    return {};
  }
}

export async function saveLead(params: {
  sessionId?: string;
  name?: string;
  phone?: string;
  email?: string;
  interestedCourse?: string;
  consentGiven: boolean;
}): Promise<{ id: string }> {
  if (!params.consentGiven) {
    throw new Error("Lead cannot be saved without consent");
  }

  const { data, error } = await supabase()
    .from("leads")
    .insert({
      session_id: params.sessionId ?? null,
      name: params.name ?? null,
      phone: params.phone ?? null,
      email: params.email ?? null,
      interested_course: params.interestedCourse ?? null,
      consent_given: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save lead: ${error.message}`);
  return { id: data.id };
}
