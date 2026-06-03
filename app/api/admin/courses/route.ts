import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("name");

  if (error) return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  return NextResponse.json({ courses: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "name is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      name: (body.name as string).trim(),
      description: (body.description as string | undefined) ?? null,
      duration: (body.duration as string | undefined) ?? null,
      target_audience: (body.target_audience as string | undefined) ?? null,
      prerequisites: (body.prerequisites as string | undefined) ?? null,
      pricing: (body.pricing as number | undefined) ?? null,
      status: (body.status as string | undefined) ?? "active",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 500 });
  return NextResponse.json({ course: data }, { status: 201 });
}
