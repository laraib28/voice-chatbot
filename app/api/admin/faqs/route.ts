import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  const supabase = createServiceClient();
  let query = supabase
    .from("faqs")
    .select("*")
    .order("order_index");

  if (courseId) query = query.eq("course_id", courseId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  return NextResponse.json({ faqs: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;

  if (!body.question || !body.answer) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "question and answer are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("faqs")
    .insert({
      question: (body.question as string).trim(),
      answer: (body.answer as string).trim(),
      course_id: (body.course_id as string | undefined) ?? null,
      order_index: (body.order_index as number | undefined) ?? 0,
      is_active: (body.is_active as boolean | undefined) ?? true,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 500 });
  return NextResponse.json({ faq: data }, { status: 201 });
}
