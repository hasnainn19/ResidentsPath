import { describe, expect, it } from "vitest";

import {
  isValidCaseReferenceNumber,
  isBookingReferenceNumber,
  normaliseCaseReferenceNumber,
  normaliseReferenceNumber,
} from "../../shared/referenceNumbers";

describe("referenceNumbers", () => {
  it("normalises case reference numbers and converts blank strings to undefined", () => {
    expect(normaliseCaseReferenceNumber("  abc-def234  ")).toBe("ABC-DEF234");
    expect(normaliseCaseReferenceNumber("   ")).toBeUndefined();
  });

  it("returns undefined for missing case reference numbers and passes through non-strings", () => {
    expect(normaliseCaseReferenceNumber(undefined)).toBeUndefined();
    expect(normaliseCaseReferenceNumber(123)).toBe(123);
  });

  it("validates case reference numbers against the shared format", () => {
    expect(isValidCaseReferenceNumber("ABC-DEF234")).toBe(true);
    expect(isValidCaseReferenceNumber("AIO-DEF234")).toBe(false);
  });

  it("normalises reference numbers by trimming and uppercasing them", () => {
    expect(normaliseReferenceNumber("  apt-abc234  ")).toBe("APT-ABC234");
  });

  it("accepts a valid booking reference after normalisation", () => {
    expect(isBookingReferenceNumber("  apt-abc234  ")).toBe(true);
  });

  it("rejects booking references with an invalid prefix", () => {
    expect(isBookingReferenceNumber("ABC-ABC234")).toBe(false);
  });

  it("rejects booking references with excluded letters or digits", () => {
    expect(isBookingReferenceNumber("APT-AIO101")).toBe(false);
  });
});
