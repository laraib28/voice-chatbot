import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("leads").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
