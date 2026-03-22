import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockUpdate, mockGetAppointmentDetails } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockGetAppointmentDetails: vi.fn(),
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

import { handler as _handler } from "../../../amplify/functions/cancelAppointmentByReference/handler";

const handler = _handler as (event: any) => Promise<any>;

function makeEvent(referenceNumber: string) {
  return { arguments: { referenceNumber } } as any;
}

describe("cancelAppointmentByReference handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
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

  // -- Already cancelled / invalid state --

  it("returns alreadyCancelled when appointment already cancelled", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", status: "CANCELLED" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.ok).toBe(true);
    expect(result?.cancelled).toBe(false);
    expect(result?.alreadyCancelled).toBe(true);
    expect(result?.referenceNumber).toBe("ABC-DEF234");
    expect(result?.bookingReferenceNumber).toBe("APT-ABC234");
  });

  it("returns INVALID_STATE for completed appointment", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", status: "COMPLETED" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("INVALID_STATE");
  });

  it("returns INVALID_STATE for NO_SHOW appointment", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", status: "NO_SHOW" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.errorCode).toBe("INVALID_STATE");
  });

  it("returns INVALID_STATE for confirmed appointment", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", status: "CONFIRMED" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.errorCode).toBe("INVALID_STATE");
  });

  // -- Successful cancellation --

  it("cancels scheduled appointment when it can still be cancelled", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", status: "SCHEDULED" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.ok).toBe(true);
    expect(result?.cancelled).toBe(true);
    expect(result?.alreadyCancelled).toBe(false);
    expect(result?.referenceNumber).toBe("ABC-DEF234");
    expect(result?.bookingReferenceNumber).toBe("APT-ABC234");
    expect(mockUpdate).toHaveBeenCalledWith({ id: "apt1", status: "CANCELLED" });
  });

  // -- Update failure --

  it("returns SERVER error when update fails", async () => {
    mockGetAppointmentDetails.mockResolvedValue({
      found: true,
      referenceNumber: "APT-ABC234",
      appointment: { id: "apt1", status: "SCHEDULED" },
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });
    mockUpdate.mockResolvedValue({ errors: [{ message: "fail" }] });

    const result = await handler(makeEvent("APT-ABC234"));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
  });
});
