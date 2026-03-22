import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockUpdate, mockGetAppointmentDetails, mockGetCurrentDateTime } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockGetAppointmentDetails: vi.fn(),
  mockGetCurrentDateTime: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Appointment: { update: mockUpdate },
    },
  }),
}));

vi.mock("../../../amplify/functions/utils/getAppointmentReferenceDetails", () => ({
  getAppointmentReferenceDetails: mockGetAppointmentDetails,
}));

vi.mock("../../../shared/formSchema", () => ({
  getCurrentAppointmentDateTime: mockGetCurrentDateTime,
}));

import { handler as _handler } from "../../../amplify/functions/checkInAppointmentByReference/handler";

const handler = _handler as (event: any) => Promise<any>;

function makeEvent(referenceNumber: string) {
  return { arguments: { referenceNumber } } as any;
}

const scheduledToday = {
  found: true,
  referenceNumber: "APT-ABC234",
  appointment: { id: "apt1", date: "2026-06-15", status: "SCHEDULED" },
  caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
};

describe("checkInAppointmentByReference handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetCurrentDateTime.mockReturnValue({ dateIso: "2026-06-15" });
    mockUpdate.mockResolvedValue({ errors: undefined });
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore?.();
  });

  // -- Lookup errors --

  it("returns error when appointment reference is not found", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: false,
      errorCode: "NOT_FOUND",
      errorMessage: "Not found",
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("NOT_FOUND");
  });

  // -- Invalid state --

  it("returns INVALID_STATE for cancelled appointment", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", date: "2026-06-15", status: "CANCELLED" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.errorCode).toBe("INVALID_STATE");
  });

  it("returns INVALID_STATE for completed appointment", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", date: "2026-06-15", status: "COMPLETED" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.errorCode).toBe("INVALID_STATE");
  });

  it("returns INVALID_STATE for NO_SHOW appointment", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", date: "2026-06-15", status: "NO_SHOW" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.errorCode).toBe("INVALID_STATE");
  });

  // -- Date check --

  it("returns NOT_TODAY when appointment is not today", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", date: "2026-06-20", status: "SCHEDULED" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.errorCode).toBe("NOT_TODAY");
  });

  // -- Already checked in --

  it("returns alreadyCheckedIn when confirmed with checkedInAt", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: {
        id: "apt1",
        date: "2026-06-15",
        status: "CONFIRMED",
        checkedInAt: "2026-06-15T09:00:00Z",
      },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.ok).toBe(true);
    expect(result?.alreadyCheckedIn).toBe(true);
    expect(result?.checkedIn).toBe(false);
  });

  // -- Successful check-in --

  it("checks in confirmed appointment when checkedInAt is missing", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", date: "2026-06-15", status: "CONFIRMED" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.ok).toBe(true);
    expect(result?.checkedIn).toBe(true);
    expect(result?.alreadyCheckedIn).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "apt1", status: "CONFIRMED" }),
    );
  });

  it("checks in appointment and returns reference numbers", async () => {
    mockGetAppointmentDetails.mockResolvedValue(scheduledToday);

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.ok).toBe(true);
    expect(result?.checkedIn).toBe(true);
    expect(result?.alreadyCheckedIn).toBe(false);
    expect(result?.referenceNumber).toBe("ABC-DEF234");
    expect(result?.bookingReferenceNumber).toBe("APT-ABC234");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "apt1", status: "CONFIRMED" }),
    );
  });

  // -- Update failure --

  it("returns SERVER error when update fails", async () => {
    mockGetAppointmentDetails.mockResolvedValue(scheduledToday);
    mockUpdate.mockResolvedValue({ errors: [{ message: "fail" }] });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
  });
});
