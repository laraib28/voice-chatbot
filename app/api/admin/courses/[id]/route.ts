import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json() as Record<string, unknown>;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("courses")
    .update(body)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: error.message }, { status: 500 });
  }
  return NextResponse.json({ course: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("courses")
    .update({ status: "archived" })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
