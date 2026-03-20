import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockListAppointment, mockGetCase } = vi.hoisted(() => ({
  mockListAppointment: vi.fn(),
  mockGetCase: vi.fn(),
}));

vi.mock("../../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Appointment: {
        listAppointmentByBookingReferenceNumber: mockListAppointment,
      },
      Case: {
        get: mockGetCase,
      },
    },
  }),
}));

import { getAppointmentReferenceDetails } from "../../../../amplify/functions/utils/getAppointmentReferenceDetails";

describe("getAppointmentReferenceDetails", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -- Input Validation --

  it("returns INVALID_REFERENCE for non-booking reference", async () => {
    const result = await getAppointmentReferenceDetails("INVALID", "unavailable");
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.errorCode).toBe("INVALID_REFERENCE");
    }
  });

  // -- Appointment Lookup Errors --

  it("returns SERVER error when appointment lookup fails", async () => {
    mockListAppointment.mockResolvedValue({
      data: [],
      errors: [{ message: "fail" }],
    });

    const result = await getAppointmentReferenceDetails("APT-ABC234", "unavailable msg");
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.errorCode).toBe("SERVER");
      expect(result.errorMessage).toBe("unavailable msg");
    }
  });

  it("returns NOT_FOUND when no appointment matches", async () => {
    mockListAppointment.mockResolvedValue({ data: [], errors: undefined });

    const result = await getAppointmentReferenceDetails("APT-ABC234", "unavailable");
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.errorCode).toBe("NOT_FOUND");
    }
  });

  it("returns NOT_FOUND when appointment lacks required fields", async () => {
    mockListAppointment.mockResolvedValue({
      data: [{ id: "apt1", caseId: null, date: null }],
      errors: undefined,
    });

    const result = await getAppointmentReferenceDetails("APT-ABC234", "unavailable");
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.errorCode).toBe("NOT_FOUND");
    }
  });

  // -- Case Lookup Errors --

  it("returns SERVER when case lookup fails", async () => {
    mockListAppointment.mockResolvedValue({
      data: [
        { id: "apt1", caseId: "case1", date: "2026-06-15", time: "09:00", status: "SCHEDULED" },
      ],
      errors: undefined,
    });
    mockGetCase.mockResolvedValue({
      data: null,
      errors: [{ message: "case fail" }],
    });

    const result = await getAppointmentReferenceDetails("APT-ABC234", "unavailable msg");
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.errorCode).toBe("SERVER");
    }
  });

  it("returns SERVER when case record is missing", async () => {
    mockListAppointment.mockResolvedValue({
      data: [{ id: "apt1", caseId: "case1", date: "2026-06-15", time: "09:00" }],
      errors: undefined,
    });
    mockGetCase.mockResolvedValue({ data: null, errors: undefined });

    const result = await getAppointmentReferenceDetails("APT-ABC234", "unavailable");
    expect(result.found).toBe(false);
    if (!result.found) {
      expect(result.errorCode).toBe("SERVER");
    }
  });

  // -- Success Cases --

  it("returns found result with appointment and case details on success", async () => {
    mockListAppointment.mockResolvedValue({
      data: [
        {
          id: "apt1",
          caseId: "case1",
          date: "2026-06-15",
          time: "09:00",
          status: "SCHEDULED",
          checkedInAt: null,
        },
      ],
      errors: undefined,
    });
    mockGetCase.mockResolvedValue({
      data: { id: "case1", referenceNumber: "ABC-DEF234" },
      errors: undefined,
    });

    const result = await getAppointmentReferenceDetails("APT-ABC234", "unavailable");
    expect(result.found).toBe(true);
    if (result.found) {
      expect(result.referenceNumber).toBe("APT-ABC234");
      expect(result.appointment).toEqual({
        id: "apt1",
        caseId: "case1",
        date: "2026-06-15",
        status: "SCHEDULED",
        checkedInAt: undefined,
      });
      expect(result.caseRecord).toEqual({
        id: "case1",
        referenceNumber: "ABC-DEF234",
      });
    }
  });

  // -- Input Normalisation --

  it("normalises the reference number input", async () => {
    mockListAppointment.mockResolvedValue({ data: [], errors: undefined });

    await getAppointmentReferenceDetails("  apt-abc234  ", "unavailable");
    expect(mockListAppointment).toHaveBeenCalledWith({
      bookingReferenceNumber: "APT-ABC234",
    });
  });
});
