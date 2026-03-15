export const CASE_REFERENCE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CASE_REFERENCE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const BOOKING_REFERENCE_PREFIX = "APT";
export const BOOKING_REFERENCE_LETTERS = CASE_REFERENCE_LETTERS;
export const BOOKING_REFERENCE_DIGITS = "23456789";

const BOOKING_REFERENCE_RE = /^APT-[A-HJKMNPQRSTUVWXYZ]{3}[2-9]{3}$/;

export function normaliseReferenceNumber(value: string) {
  return value.trim().toUpperCase();
}

export function isBookingReferenceNumber(value: string) {
  return BOOKING_REFERENCE_RE.test(normaliseReferenceNumber(value));
}
