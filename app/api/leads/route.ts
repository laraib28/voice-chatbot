import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { validateLeadRequest, sanitizePhone } from "@/lib/utils/validation";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);
  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many lead submissions." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const validation = validateLeadRequest(body);
  if (!validation.valid) {
    const firstError = validation.errors[0];
    if (firstError?.includes("consentGiven")) {
      return NextResponse.json(
        { error: "CONSENT_REQUIRED", message: "Lead cannot be saved without consent." },
        { status: 400 }
      );
    }
    if (firstError?.includes("At least one")) {
      return NextResponse.json(
        { error: "EMPTY_LEAD", message: firstError },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: firstError },
      { status: 400 }
    );
  }

  const req = body as {
    sessionId?: string;
    name?: string;
    phone?: string;
    email?: string;
    interestedCourse?: string;
    consentGiven: boolean;
  };

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      session_id: req.sessionId ?? null,
      name: req.name?.trim() ?? null,
      phone: req.phone ? sanitizePhone(req.phone) : null,
      email: req.email?.trim().toLowerCase() ?? null,
      interested_course: req.interestedCourse?.trim() ?? null,
      consent_given: true,
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[leads/route] Supabase error:", error);
    return NextResponse.json(
      { error: "STORAGE_ERROR", message: "Failed to save your information. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { id: data.id, createdAt: data.created_at },
    { status: 201 }
  );
}
