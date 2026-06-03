import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("settings").select("*").order("key");

  if (error) return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json() as { updates?: Array<{ key: string; value: string }> };

  if (!Array.isArray(body.updates) || body.updates.length === 0) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "updates array is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const results = await Promise.all(
    body.updates.map(({ key, value }) =>
      supabase.from("settings").update({ value }).eq("key", key).select("*").single()
    )
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ settings: results.map((r) => r.data) });
}
