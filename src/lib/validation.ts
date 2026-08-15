import { z } from "zod";

/** Strict-ish email pattern: no spaces, single @, dotted TLD of 2+ letters. */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(255, "Email is too long")
  .regex(EMAIL_RE, "Enter a valid email address");

/** Digits only, ignoring formatting characters. */
export function phoneDigits(value: string): string {
  return (value || "").replace(/[^\d]/g, "");
}

/** Accepts US/CA numbers: 10 digits, or 11 digits starting with 1. */
export function isValidPhone(value: string): boolean {
  const d = phoneDigits(value);
  if (d.length === 11 && d.startsWith("1")) return /^1[2-9]\d{2}[2-9]\d{6}$/.test(d);
  return d.length === 10 && /^[2-9]\d{2}[2-9]\d{6}$/.test(d);
}

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .max(40)
  .refine(isValidPhone, "Enter a valid 10-digit US phone number");

export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(40)
  .optional()
  .refine((v) => !v || isValidPhone(v), "Enter a valid 10-digit US phone number");

/** Formats as (415) 555-0123 while typing. */
export function formatPhoneInput(value: string): string {
  const d = phoneDigits(value).replace(/^1(?=\d)/, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

/**
 * Validates a contact pair for plain (non react-hook-form) forms.
 * Returns the first error message, or null when valid.
 */
export function validateContact({
  email,
  phone,
  phoneRequired = true,
}: {
  email?: string;
  phone?: string;
  phoneRequired?: boolean;
}): string | null {
  if (email !== undefined && !isValidEmail(email)) return "Please enter a valid email address.";
  if (phone !== undefined) {
    if (!phone.trim()) {
      if (phoneRequired) return "Please enter a phone number.";
    } else if (!isValidPhone(phone)) {
      return "Please enter a valid 10-digit US phone number.";
    }
  }
  return null;
}
