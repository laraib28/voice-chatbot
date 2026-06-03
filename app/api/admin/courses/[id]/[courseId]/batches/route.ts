import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("course_batches")
    .select("*")
    .eq("course_id", params.courseId)
    .order("start_date");

  if (error) return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  return NextResponse.json({ batches: data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const body = await request.json() as Record<string, unknown>;

  if (!body.start_date || !body.end_date) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "start_date and end_date are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("course_batches")
    .insert({ ...body, course_id: params.courseId })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 500 });
  return NextResponse.json({ batch: data }, { status: 201 });
}
