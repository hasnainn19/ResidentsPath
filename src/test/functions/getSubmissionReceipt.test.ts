import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockLoadAccessibleCase, mockListTickets, mockListAppointments } = vi.hoisted(() => ({
  mockLoadAccessibleCase: vi.fn(),
  mockListTickets: vi.fn(),
  mockListAppointments: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Ticket: {
        listTicketByCaseId: mockListTickets,
      },
      Appointment: {
        listAppointmentByCaseId: mockListAppointments,
      },
    },
  }),
}));

vi.mock("../../../amplify/functions/utils/caseAccess", () => ({
  createFoundErrorResponse: (msg: string) => ({ found: false, errorMessage: msg }),
  getCaseAccessErrorMessage: (reason: string, msgs: Record<string, string>) => {
    if (reason === "CASE_NOT_FOUND" || reason === "USER_NOT_FOUND") return msgs.notFound;
    if (reason === "REGISTERED_USER_ACCESS_DENIED") return msgs.accessDenied;
    return msgs.loadFailed;
  },
  loadAccessibleCaseByReference: mockLoadAccessibleCase,
}));

vi.mock("../../../shared/formSchema", () => ({
  DepartmentLabelByName: {
    Homelessness: "Homelessness",
    Adults_Duty: "Adults duty",
  },
}));

import { handler as _handler } from "../../../amplify/functions/getSubmissionReceipt/handler";

const handler = _handler as (event: any) => Promise<any>;

function makeEvent(referenceNumber: string, identity: unknown = null) {
  return { arguments: { referenceNumber }, identity } as any;
}

describe("getSubmissionReceipt handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // -- Case access --

  it("returns error when case lookup fails", async () => {
    mockLoadAccessibleCase.mockResolvedValue({ reason: "CASE_NOT_FOUND" });
    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.found).toBe(false);
  });

  // -- Receipt lookup errors --

  it("returns error when no tickets or appointments found", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234", departmentName: "Homelessness" },
    });
    mockListTickets.mockResolvedValue({ data: [], errors: undefined });
    mockListAppointments.mockResolvedValue({ data: [], errors: undefined });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.found).toBe(false);
    expect(result?.errorMessage).toContain("could not find receipt details");
  });

  // -- Successful receipts --

  it("returns queue receipt with all fields when only ticket exists", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        referenceNumber: "ABC-DEF234",
        departmentName: "Homelessness",
        createdAt: "2025-06-15T10:00:00Z",
      },
    });
    mockListTickets.mockResolvedValue({
      data: [
        {
          ticketNumber: "H001",
          estimatedWaitTimeLower: 10,
          estimatedWaitTimeUpper: 20,
          createdAt: "2025-06-15T10:00:00Z",
        },
      ],
      errors: undefined,
    });
    mockListAppointments.mockResolvedValue({ data: [], errors: undefined });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.found).toBe(true);
    expect(result?.receiptType).toBe("QUEUE");
    expect(result?.ticketNumber).toBe("H001");
    expect(result?.referenceNumber).toBe("ABC-DEF234");
    expect(result?.estimatedWaitTimeLower).toBe(10);
    expect(result?.estimatedWaitTimeUpper).toBe(20);
    expect(result?.createdAt).toBe("2025-06-15T10:00:00Z");
    expect(result?.bookingReferenceNumber).toBeUndefined();
    expect(result?.appointmentDateIso).toBeUndefined();
    expect(result?.appointmentTime).toBeUndefined();
  });

  it("returns appointment receipt with all fields when only appointment exists", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        referenceNumber: "ABC-DEF234",
        departmentName: "Homelessness",
        createdAt: "2025-06-15T10:00:00Z",
      },
    });
    mockListTickets.mockResolvedValue({ data: [], errors: undefined });
    mockListAppointments.mockResolvedValue({
      data: [
        {
          bookingReferenceNumber: "APT-ABC234",
          date: "2025-06-20",
          time: "09:00",
          createdAt: "2025-06-15T10:00:00Z",
        },
      ],
      errors: undefined,
    });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.found).toBe(true);
    expect(result?.receiptType).toBe("APPOINTMENT");
    expect(result?.bookingReferenceNumber).toBe("APT-ABC234");
    expect(result?.appointmentDateIso).toBe("2025-06-20");
    expect(result?.appointmentTime).toBe("09:00");
    expect(result?.createdAt).toBe("2025-06-15T10:00:00Z");
    expect(result?.ticketNumber).toBeUndefined();
    expect(result?.estimatedWaitTimeLower).toBeUndefined();
    expect(result?.estimatedWaitTimeUpper).toBeUndefined();
  });

  // -- Ticket vs appointment priority --

  it("returns appointment receipt when appointment is newer than ticket", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        referenceNumber: "ABC-DEF234",
        departmentName: "Homelessness",
      },
    });
    mockListTickets.mockResolvedValue({
      data: [{ ticketNumber: "H001", createdAt: "2025-06-15T08:00:00Z" }],
      errors: undefined,
    });
    mockListAppointments.mockResolvedValue({
      data: [
        {
          bookingReferenceNumber: "APT-XYZ987",
          date: "2025-06-20",
          time: "14:00",
          createdAt: "2025-06-15T12:00:00Z",
        },
      ],
      errors: undefined,
    });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.receiptType).toBe("APPOINTMENT");
  });

  it("returns queue receipt when ticket is newer than appointment", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234", departmentName: "Homelessness" },
    });
    mockListTickets.mockResolvedValue({
      data: [{ ticketNumber: "H001", createdAt: "2025-06-15T14:00:00Z" }],
      errors: undefined,
    });
    mockListAppointments.mockResolvedValue({
      data: [
        {
          bookingReferenceNumber: "APT-XYZ987",
          date: "2025-06-20",
          time: "09:00",
          createdAt: "2025-06-15T08:00:00Z",
        },
      ],
      errors: undefined,
    });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.receiptType).toBe("QUEUE");
    expect(result?.ticketNumber).toBe("H001");
  });

  // -- Lookup errors --

  it("returns error when ticket lookup has errors", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234", departmentName: "Homelessness" },
    });
    mockListTickets.mockResolvedValue({ data: [], errors: [{ message: "fail" }] });
    mockListAppointments.mockResolvedValue({ data: [], errors: undefined });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.found).toBe(false);
  });

  it("returns error when appointment lookup has errors", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234", departmentName: "Homelessness" },
    });
    mockListTickets.mockResolvedValue({ data: [], errors: undefined });
    mockListAppointments.mockResolvedValue({ data: [], errors: [{ message: "fail" }] });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.found).toBe(false);
  });

  // -- Input normalisation --

  it("normalises reference number", async () => {
    mockLoadAccessibleCase.mockResolvedValue({ reason: "CASE_NOT_FOUND" });
    await handler(makeEvent("  abc-def234  "));
    const call = mockLoadAccessibleCase.mock.calls[0];
    expect(call[2]).toBe("ABC-DEF234");
    expect(call[3]).toBe("getSubmissionReceipt");
  });

  // -- Department and timestamp mapping --

  it("maps department name to label", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        referenceNumber: "ABC-DEF234",
        departmentName: "Adults_Duty",
      },
    });
    mockListTickets.mockResolvedValue({
      data: [{ ticketNumber: "A001", createdAt: "2025-06-15T10:00:00Z" }],
      errors: undefined,
    });
    mockListAppointments.mockResolvedValue({ data: [], errors: undefined });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.departmentName).toBe("Adults duty");
  });

  it("falls back to raw department name when not in label map", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234", departmentName: "Council_tax" },
    });
    mockListTickets.mockResolvedValue({
      data: [{ ticketNumber: "U001", createdAt: "2025-06-15T10:00:00Z" }],
      errors: undefined,
    });
    mockListAppointments.mockResolvedValue({ data: [], errors: undefined });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.departmentName).toBe("Council_tax");
  });

  it("uses caseRecord.createdAt when ticket has no createdAt", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        referenceNumber: "ABC-DEF234",
        departmentName: "Homelessness",
        createdAt: "2025-06-15T09:00:00Z",
      },
    });
    mockListTickets.mockResolvedValue({
      data: [{ ticketNumber: "H001" }],
      errors: undefined,
    });
    mockListAppointments.mockResolvedValue({ data: [], errors: undefined });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.createdAt).toBe("2025-06-15T09:00:00Z");
  });

  it("returns departmentName undefined when case has no department", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234" },
    });
    mockListTickets.mockResolvedValue({
      data: [{ ticketNumber: "H001", createdAt: "2025-06-15T10:00:00Z" }],
      errors: undefined,
    });
    mockListAppointments.mockResolvedValue({ data: [], errors: undefined });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.departmentName).toBeUndefined();
  });

  it("returns access denied error for registered user without access", async () => {
    mockLoadAccessibleCase.mockResolvedValue({ reason: "REGISTERED_USER_ACCESS_DENIED" });
    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.found).toBe(false);
    expect(result?.errorMessage).toContain("log in");
  });

  it("returns undefined createdAt when no timestamps exist", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234", departmentName: "Homelessness" },
    });
    mockListTickets.mockResolvedValue({
      data: [{ ticketNumber: "H001" }],
      errors: undefined,
    });
    mockListAppointments.mockResolvedValue({ data: [], errors: undefined });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.createdAt).toBeUndefined();
  });

  it("picks latest ticket when multiple exist", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: { id: "c1", referenceNumber: "ABC-DEF234", departmentName: "Homelessness" },
    });
    mockListTickets.mockResolvedValue({
      data: [
        { ticketNumber: "H001", createdAt: "2025-06-15T08:00:00Z" },
        { ticketNumber: "H002", createdAt: "2025-06-15T12:00:00Z" },
        { ticketNumber: "H003", createdAt: "2025-06-15T10:00:00Z" },
      ],
      errors: undefined,
    });
    mockListAppointments.mockResolvedValue({ data: [], errors: undefined });

    const result = await handler(makeEvent("ABC-DEF234"));
    expect(result?.ticketNumber).toBe("H002");
  });
});
