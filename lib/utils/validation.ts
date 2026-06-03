const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export interface LeadRequest {
  sessionId?: string;
  name?: string;
  phone?: string;
  email?: string;
  interestedCourse?: string;
  consentGiven: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateLeadRequest(body: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  const req = body as Record<string, unknown>;

  if (req.consentGiven !== true) {
    errors.push("consentGiven must be true");
  }

  const hasAtLeastOne = ["name", "phone", "email", "interestedCourse"].some(
    (field) =>
      typeof req[field] === "string" && (req[field] as string).trim().length > 0
  );

  if (!hasAtLeastOne) {
    errors.push("At least one of name, phone, email, or interestedCourse must be provided");
  }

  if (
    typeof req.email === "string" &&
    req.email.trim().length > 0 &&
    !validateEmail(req.email)
  ) {
    errors.push("email format is invalid");
  }

  if (
    req.sessionId !== undefined &&
    typeof req.sessionId === "string" &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      req.sessionId
    )
  ) {
    errors.push("sessionId must be a valid UUID v4");
  }

  return { valid: errors.length === 0, errors };
}
