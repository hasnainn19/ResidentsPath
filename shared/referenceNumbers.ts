export const CASE_REFERENCE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CASE_REFERENCE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CASE_REFERENCE_RE = new RegExp(
  `^[${CASE_REFERENCE_LETTERS}]{3}-[${CASE_REFERENCE_CHARS}]{6}$`,
);
export const BOOKING_REFERENCE_PREFIX = "APT";
export const BOOKING_REFERENCE_LETTERS = CASE_REFERENCE_LETTERS;
export const BOOKING_REFERENCE_DIGITS = "23456789";

const BOOKING_REFERENCE_RE = /^APT-[A-HJKMNPQRSTUVWXYZ]{3}[2-9]{3}$/;

export function normaliseCaseReferenceNumber(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;

  const trimmed = value.trim().toUpperCase();
  return trimmed.length ? trimmed : undefined;
}

export function isValidCaseReferenceNumber(value: string) {
  return CASE_REFERENCE_RE.test(value);
}

export function normaliseReferenceNumber(value: string) {
  return value.trim().toUpperCase();
}

export function isBookingReferenceNumber(value: string) {
  return BOOKING_REFERENCE_RE.test(normaliseReferenceNumber(value));
}
