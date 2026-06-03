import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateLeadRequest, validateEmail, sanitizePhone } from "@/lib/utils/validation";
import { detectLanguage } from "@/lib/utils/language";

describe("validateLeadRequest", () => {
  it("rejects if consentGiven is false", () => {
    const result = validateLeadRequest({
      consentGiven: false,
      name: "Test User",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("consentGiven must be true");
  });

  it("rejects if all contact fields are empty", () => {
    const result = validateLeadRequest({ consentGiven: true });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("At least one"))).toBe(true);
  });

  it("accepts partial lead with only name", () => {
    const result = validateLeadRequest({ consentGiven: true, name: "Alice" });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = validateLeadRequest({
      consentGiven: true,
      email: "not-an-email",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("email format is invalid");
  });

  it("accepts valid email", () => {
    const result = validateLeadRequest({
      consentGiven: true,
      email: "alice@example.com",
    });
    expect(result.valid).toBe(true);
  });
});

describe("validateEmail", () => {
  it("validates correct emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("user+tag@sub.domain.com")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("notanemail")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
  });
});

describe("sanitizePhone", () => {
  it("strips non-numeric characters except +", () => {
    expect(sanitizePhone("+92 300 1234567")).toBe("+923001234567");
    expect(sanitizePhone("(021) 123-4567")).toBe("0211234567");
  });
});

describe("detectLanguage", () => {
  it("detects English", () => {
    expect(detectLanguage("What courses are available?")).toBe("en");
  });

  it("detects Roman Urdu", () => {
    expect(detectLanguage("Mujhe courses ke baare mein batao")).toBe("roman_ur");
  });

  it("detects Urdu script", () => {
    expect(detectLanguage("مجھے کورسز کے بارے میں بتاؤ")).toBe("ur");
  });

  it("defaults to en for empty string", () => {
    expect(detectLanguage("")).toBe("en");
  });
});
