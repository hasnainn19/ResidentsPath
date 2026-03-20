import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockClient,
  mockLoadAccessibleCase,
  mockGetHasActiveWaitingTicket,
  mockGetCaseAppointmentCount,
  mockIsStaffIdentity,
} = vi.hoisted(() => ({
  mockClient: {},
  mockLoadAccessibleCase: vi.fn(),
  mockGetHasActiveWaitingTicket: vi.fn(),
  mockGetCaseAppointmentCount: vi.fn(),
  mockIsStaffIdentity: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue(mockClient),
}));

vi.mock("../../../amplify/functions/utils/caseAccess", () => ({
  CASE_ACCESS_NOT_FOUND_MESSAGE: "We could not find a case with that reference number.",
  CASE_ACCESS_ACCESS_DENIED_MESSAGE:
    "We could not find that case reference number. If this case is linked to your account, please log in and try again.",
  createFoundErrorResponse: (errorMessage: string) => ({
    found: false,
    errorMessage,
  }),
  getCaseAccessErrorMessage: (
    reason: string,
    messages: { notFound: string; accessDenied: string; loadFailed: string },
  ) => {
    if (reason === "CASE_NOT_FOUND" || reason === "USER_NOT_FOUND") {
      return messages.notFound;
    }

    if (reason === "REGISTERED_USER_ACCESS_DENIED") {
      return messages.accessDenied;
    }

    return messages.loadFailed;
  },
  getHasActiveWaitingTicket: mockGetHasActiveWaitingTicket,
  loadAccessibleCaseByReference: mockLoadAccessibleCase,
}));

vi.mock("../../../amplify/functions/utils/submissionShared", () => ({
  getCaseAppointmentCount: mockGetCaseAppointmentCount,
  RESIDENT_CASE_APPOINTMENT_LIMIT: 2,
}));

vi.mock("../../../amplify/functions/utils/identityGroups", () => ({
  isStaffIdentity: mockIsStaffIdentity,
}));

import { handler as _handler } from "../../../amplify/functions/getCaseFollowUp/handler";

type GetCaseFollowUpEvent = {
  arguments: {
    referenceNumber: string;
  };
  identity?: unknown;
};

type GetCaseFollowUpResult = {
  found: boolean;
  errorMessage?: string;
  referenceNumber?: string;
  departmentName?: string;
  status?: string;
  hasActiveWaitingTicket?: boolean;
  hasReachedAppointmentLimit?: boolean;
};

const handler = _handler as (event: GetCaseFollowUpEvent) => Promise<GetCaseFollowUpResult>;

function makeEvent(referenceNumber: string, identity?: unknown): GetCaseFollowUpEvent {
  const event: GetCaseFollowUpEvent = { arguments: { referenceNumber } };

  if (identity !== undefined) {
    event.identity = identity;
  }

  return event;
}

const openCaseRecord = {
  id: "case1",
  referenceNumber: "ABC-DEF234",
  departmentName: "Homelessness",
  status: "OPEN",
};

describe("getCaseFollowUp handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockIsStaffIdentity.mockReturnValue(false);
    mockGetHasActiveWaitingTicket.mockResolvedValue({ hasActiveWaitingTicket: false });
    mockGetCaseAppointmentCount.mockResolvedValue(1);
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: openCaseRecord,
    });
  });

  // -- Validation --

  it("returns an error when the reference number is blank", async () => {
    const result = await handler(makeEvent("   "));

    expect(result?.found).toBe(false);
    expect(result?.errorMessage).toBe("Enter a case reference number.");
    expect(mockLoadAccessibleCase).not.toHaveBeenCalled();
  });

  it("returns an error when the reference number format is invalid", async () => {
    const result = await handler(makeEvent("ABC123"));

    expect(result?.found).toBe(false);
    expect(result?.errorMessage).toBe("Enter a valid case reference number.");
    expect(mockLoadAccessibleCase).not.toHaveBeenCalled();
  });

  // -- Case access --

  it("normalises the reference number before loading the case", async () => {
    await handler(makeEvent(" abc-def234 "));

    expect(mockLoadAccessibleCase).toHaveBeenCalledWith(
      mockClient,
      undefined,
      "ABC-DEF234",
      "getCaseFollowUp",
    );
  });

  it("returns an error when the case cannot be found", async () => {
    mockLoadAccessibleCase.mockResolvedValue({ reason: "CASE_NOT_FOUND" });

    const result = await handler(makeEvent(" abc-def234 "));

    expect(result?.found).toBe(false);
    expect(result?.errorMessage).toBe("We could not find a case with that reference number.");
  });

  // -- Case status --

  it("returns an error when the case status is CLOSED", async () => {
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        ...openCaseRecord,
        status: "CLOSED",
      },
    });

    const result = await handler(makeEvent("ABC-DEF234"));

    expect(result?.found).toBe(false);
    expect(result?.errorMessage).toBe(
      "This case cannot be updated online right now. Please contact us if you still need help.",
    );
  });

  // -- Waiting tickets --

  it("returns an error when the waiting ticket lookup fails", async () => {
    mockGetHasActiveWaitingTicket.mockResolvedValue({ reason: "TICKET_LOOKUP_FAILED" });

    const result = await handler(makeEvent("ABC-DEF234"));

    expect(result?.found).toBe(false);
    expect(result?.errorMessage).toBe("We could not load that case right now.");
  });

  // -- Appointment limits --

  it("returns an error when the resident appointment count cannot be loaded", async () => {
    mockGetCaseAppointmentCount.mockResolvedValue(null);

    const result = await handler(makeEvent("ABC-DEF234"));

    expect(result?.found).toBe(false);
    expect(result?.errorMessage).toBe("We could not load that case right now.");
  });

  it("returns the case details for residents and reports when the appointment limit is reached", async () => {
    mockGetHasActiveWaitingTicket.mockResolvedValue({ hasActiveWaitingTicket: true });
    mockGetCaseAppointmentCount.mockResolvedValue(2);

    const result = await handler(makeEvent("ABC-DEF234"));

    expect(mockGetHasActiveWaitingTicket).toHaveBeenCalledWith(
      mockClient,
      "case1",
      "getCaseFollowUp",
    );
    expect(mockGetCaseAppointmentCount).toHaveBeenCalledWith(
      mockClient,
      "case1",
      "getCaseFollowUp",
    );
    expect(result).toEqual({
      found: true,
      referenceNumber: "ABC-DEF234",
      departmentName: "Homelessness",
      status: "OPEN",
      hasActiveWaitingTicket: true,
      hasReachedAppointmentLimit: true,
    });
  });

  it("skips the appointment count lookup for staff users", async () => {
    mockIsStaffIdentity.mockReturnValue(true);
    mockLoadAccessibleCase.mockResolvedValue({
      caseRecord: {
        ...openCaseRecord,
        status: "IN_PROGRESS",
      },
    });

    const result = await handler(makeEvent("ABC-DEF234", { groups: ["Staff"] }));

    expect(mockGetCaseAppointmentCount).not.toHaveBeenCalled();
    expect(result).toEqual({
      found: true,
      referenceNumber: "ABC-DEF234",
      departmentName: "Homelessness",
      status: "IN_PROGRESS",
      hasActiveWaitingTicket: false,
      hasReachedAppointmentLimit: false,
    });
  });
});
