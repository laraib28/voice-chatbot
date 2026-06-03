import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServiceClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAdminRoute =
    path.startsWith("/admin") || path.startsWith("/api/admin");

  // Skip auth entirely for public routes — saves 3s Supabase roundtrip
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  if (!user) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  // Verify the user is in the administrators table
  const supabase = createServiceClient();
  const { data: admin } = await supabase
    .from("administrators")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!admin) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
