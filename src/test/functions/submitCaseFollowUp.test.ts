import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  mockLoadAccessibleCase,
  mockGetHasActiveWaitingTicket,
  mockCreateAppointmentSubmission,
  mockCreateQueueSubmission,
  mockCleanupCreatedVisitResources,
  mockCreateCaseUpdate,
  mockGetCaseAppointmentCount,
} = vi.hoisted(() => ({
  mockLoadAccessibleCase: vi.fn(),
  mockGetHasActiveWaitingTicket: vi.fn(),
  mockCreateAppointmentSubmission: vi.fn(),
  mockCreateQueueSubmission: vi.fn(),
  mockCleanupCreatedVisitResources: vi.fn(),
  mockCreateCaseUpdate: vi.fn(),
  mockGetCaseAppointmentCount: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../../shared/formSchema", () => ({
  caseFollowUpSchema: {
    safeParse: (input: any) => {
      if (!input || !input.referenceNumber)
        return { success: false, error: { issues: [{ message: "fail" }] } };
      return { success: true, data: input };
    },
  },
}));

vi.mock("../../../amplify/functions/utils/caseAccess", () => ({
  CASE_ACCESS_NOT_FOUND_MESSAGE: "Not found",
  CASE_ACCESS_ACCESS_DENIED_MESSAGE: "Access denied",
  getCaseAccessErrorMessage: (reason: string, msgs: Record<string, string>) => {
    if (reason === "CASE_NOT_FOUND") return msgs.notFound;
    if (reason === "REGISTERED_USER_ACCESS_DENIED") return msgs.accessDenied;
    return msgs.loadFailed;
  },
  getHasActiveWaitingTicket: mockGetHasActiveWaitingTicket,
  isCaseAccessValidationFailure: (reason: string) =>
    reason === "CASE_NOT_FOUND" ||
    reason === "USER_NOT_FOUND" ||
    reason === "REGISTERED_USER_ACCESS_DENIED",
  loadAccessibleCaseByReference: mockLoadAccessibleCase,
}));

vi.mock("../../../amplify/functions/utils/submissionShared", () => ({
  createAppointmentSubmission: mockCreateAppointmentSubmission,
  createQueueSubmission: mockCreateQueueSubmission,
  cleanupCreatedVisitResources: mockCleanupCreatedVisitResources,
  createCaseUpdate: mockCreateCaseUpdate,
  getCaseAppointmentCount: mockGetCaseAppointmentCount,
  RESIDENT_CASE_APPOINTMENT_LIMIT: 2,
}));

vi.mock("../../../amplify/functions/utils/identityGroups", () => ({
  isStaffIdentity: (id: unknown) =>
    id &&
    typeof id === "object" &&
    "groups" in (id as any) &&
    (id as any).groups?.includes("Staff"),
}));

vi.mock("../../../amplify/functions/utils/runCleanup", () => ({
  runCleanup: vi.fn(async (_p, _m, fn) => fn()),
  tryCleanup: vi.fn(async (_p, fn) => {
    try {
      await fn();
      return true;
    } catch {
      return false;
    }
  }),
}));

import { handler as _handler } from "../../../amplify/functions/submitCaseFollowUp/handler";

const handler = _handler as (event: any) => Promise<any>;

function makeEvent(input: unknown, identity: unknown = null) {
  return { arguments: { input }, identity } as any;
}

const validInput = {
  referenceNumber: "ABC-DEF234",
  proceed: "JOIN_DIGITAL_QUEUE" as const,
  caseUpdate: "some update",
};

describe("submitCaseFollowUp handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -- Validation Errors --

  it("returns VALIDATION error for invalid input", async () => {
    const result = await handler(makeEvent(null));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("VALIDATION");
  });

  it("returns error when case not found", async () => {
    mockLoadAccessibleCase.mockResolvedValue({ reason: "CASE_NOT_FOUND" });
    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("VALIDATION");
  });

  it("returns SERVER error when case lookup fails with non-validation reason", async () => {
    mockLoadAccessibleCase.mockResolvedValue({ reason: "LOAD_FAILED" });
    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
  });

  it("returns VALIDATION error for closed case", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: { id: "c1", departmentName: "Homelessness", status: "CLOSED", userId: "u1" },
    });
    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("VALIDATION");
  });

  it("returns error when active ticket lookup fails", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetHasActiveWaitingTicket.mockResolvedValue({ reason: "CASE_NOT_FOUND" });

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("VALIDATION");
  });

  it("returns SERVER error when active ticket lookup fails with non-validation reason", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetHasActiveWaitingTicket.mockResolvedValue({ reason: "UNKNOWN_FAILURE" });

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
  });

  it("returns VALIDATION error when case already has active waiting ticket", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetHasActiveWaitingTicket.mockResolvedValue({ hasActiveWaitingTicket: true });

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorMessage).toContain("already in the queue");
  });

  // -- Success Cases --

  it("succeeds with IN_PROGRESS case", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "IN_PROGRESS",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetHasActiveWaitingTicket.mockResolvedValue({ hasActiveWaitingTicket: false });
    mockCreateQueueSubmission.mockResolvedValue({
      ok: true,
      ticketNumber: "H001",
      estimatedWaitTimeLower: 10,
      estimatedWaitTimeUpper: 20,
    });
    mockCreateCaseUpdate.mockResolvedValue("update-1");

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(true);
    expect(result?.ticketNumber).toBe("H001");
  });

  it("skips case update when caseUpdate is not provided", async () => {
    const inputWithoutUpdate = {
      referenceNumber: "ABC-DEF234",
      proceed: "JOIN_DIGITAL_QUEUE" as const,
    };
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetHasActiveWaitingTicket.mockResolvedValue({ hasActiveWaitingTicket: false });
    mockCreateQueueSubmission.mockResolvedValue({
      ok: true,
      ticketNumber: "H001",
      estimatedWaitTimeLower: 10,
      estimatedWaitTimeUpper: 20,
    });

    const result = await handler(makeEvent(inputWithoutUpdate));
    expect(result?.ok).toBe(true);
    expect(mockCreateCaseUpdate).not.toHaveBeenCalled();
  });

  it("returns ok with ticket number on successful queue submission", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetHasActiveWaitingTicket.mockResolvedValue({ hasActiveWaitingTicket: false });
    mockCreateQueueSubmission.mockResolvedValue({
      ok: true,
      ticketNumber: "H001",
      estimatedWaitTimeLower: 10,
      estimatedWaitTimeUpper: 20,
    });
    mockCreateCaseUpdate.mockResolvedValue("update-1");

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(true);
    expect(result?.ticketNumber).toBe("H001");
    expect(result?.referenceNumber).toBe("ABC-DEF234");
  });

  it("returns ok with booking reference on successful appointment submission", async () => {
    const appointmentInput = {
      ...validInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2025-06-20",
      appointmentTime: "09:00",
    };
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetCaseAppointmentCount.mockResolvedValue(0);
    mockCreateAppointmentSubmission.mockResolvedValue({
      ok: true,
      bookingReferenceNumber: "APT-ABC234",
    });
    mockCreateCaseUpdate.mockResolvedValue("update-1");

    const result = await handler(makeEvent(appointmentInput));
    expect(result?.ok).toBe(true);
    expect(result?.bookingReferenceNumber).toBe("APT-ABC234");
  });

  // -- Appointment Limit --

  it("returns VALIDATION error when appointment limit reached", async () => {
    const appointmentInput = {
      ...validInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2025-06-20",
      appointmentTime: "09:00",
    };
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetCaseAppointmentCount.mockResolvedValue(2);

    const result = await handler(makeEvent(appointmentInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorMessage).toContain("only book up to two appointments");
  });

  it("returns SERVER error when appointment count lookup fails", async () => {
    const appointmentInput = {
      ...validInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2025-06-20",
      appointmentTime: "09:00",
    };
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetCaseAppointmentCount.mockResolvedValue(null);

    const result = await handler(makeEvent(appointmentInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
  });

  it("staff can bypass appointment limit", async () => {
    const appointmentInput = {
      ...validInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2025-06-20",
      appointmentTime: "09:00",
    };
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockCreateAppointmentSubmission.mockResolvedValue({
      ok: true,
      bookingReferenceNumber: "APT-ABC234",
    });

    const result = await handler(makeEvent(appointmentInput, { groups: ["Staff"] }));
    expect(result?.ok).toBe(true);
    expect(mockGetCaseAppointmentCount).not.toHaveBeenCalled();
  });

  // -- Error Handling --

  it("returns error when queue submission fails", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetHasActiveWaitingTicket.mockResolvedValue({ hasActiveWaitingTicket: false });
    mockCreateQueueSubmission.mockResolvedValue({
      ok: false,
      errorCode: "CAPACITY",
      errorMessage: "Queue full",
    });

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("CAPACITY");
    expect(result?.errorMessage).toBe("Queue full");
    expect(mockCleanupCreatedVisitResources).toHaveBeenCalled();
  });

  it("returns CONFLICT when appointment slot is taken", async () => {
    const appointmentInput = {
      ...validInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2025-06-20",
      appointmentTime: "09:00",
    };
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetCaseAppointmentCount.mockResolvedValue(0);
    mockCreateAppointmentSubmission.mockResolvedValue({
      ok: false,
      errorCode: "CONFLICT",
      errorMessage: "Slot unavailable",
    });

    const result = await handler(makeEvent(appointmentInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("CONFLICT");
    expect(mockCleanupCreatedVisitResources).toHaveBeenCalled();
  });

  it("cleans up on failure and returns SERVER error", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        id: "c1",
        departmentName: "Homelessness",
        status: "OPEN",
        userId: "u1",
        referenceNumber: "ABC-DEF234",
      },
    });
    mockGetHasActiveWaitingTicket.mockResolvedValue({ hasActiveWaitingTicket: false });
    mockCreateQueueSubmission.mockRejectedValue(new Error("fail"));

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
    expect(mockCleanupCreatedVisitResources).toHaveBeenCalled();
  });
});
