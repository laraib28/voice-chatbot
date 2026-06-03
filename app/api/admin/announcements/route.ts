import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  return NextResponse.json({ announcements: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;

  if (!body.title || !body.body) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "title and body are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: (body.title as string).trim(),
      body: (body.body as string).trim(),
      course_id: (body.course_id as string | undefined) ?? null,
      starts_at: (body.starts_at as string | undefined) ?? null,
      ends_at: (body.ends_at as string | undefined) ?? null,
      is_active: (body.is_active as boolean | undefined) ?? true,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 500 });
  return NextResponse.json({ announcement: data }, { status: 201 });
}
