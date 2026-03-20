import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createFoundErrorResponse,
  getCaseAccessErrorMessage,
  isCaseAccessValidationFailure,
  loadAccessibleCaseByReference,
  getHasActiveWaitingTicket,
} from "../../../../amplify/functions/utils/caseAccess";
import type { AmplifyClient } from "../../../../amplify/functions/utils/amplifyClient";

type ClientOverrides = {
  Case?: Record<string, unknown>;
  User?: Record<string, unknown>;
  Ticket?: Record<string, unknown>;
};

function makeClient(overrides: ClientOverrides = {}) {
  return {
    models: {
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({ data: [], errors: undefined }),
        ...(overrides.Case ?? {}),
      },
      User: {
        get: vi.fn().mockResolvedValue({ data: null, errors: undefined }),
        ...(overrides.User ?? {}),
      },
      Ticket: {
        listTicketByCaseId: vi.fn().mockResolvedValue({ data: [], errors: undefined }),
        ...(overrides.Ticket ?? {}),
      },
    },
  } as unknown as AmplifyClient;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createFoundErrorResponse", () => {
  it("returns found: false with error message", () => {
    expect(createFoundErrorResponse("some error")).toEqual({
      found: false,
      errorMessage: "some error",
    });
  });
});

describe("getCaseAccessErrorMessage", () => {
  const messages = {
    notFound: "Not found",
    accessDenied: "Access denied",
    loadFailed: "Load failed",
  };

  // -- Not Found Reasons --

  it("returns notFound for CASE_NOT_FOUND", () => {
    expect(getCaseAccessErrorMessage("CASE_NOT_FOUND", messages)).toBe("Not found");
  });

  it("returns notFound for USER_NOT_FOUND", () => {
    expect(getCaseAccessErrorMessage("USER_NOT_FOUND", messages)).toBe("Not found");
  });

  // -- Access Denied --

  it("returns accessDenied for REGISTERED_USER_ACCESS_DENIED", () => {
    expect(getCaseAccessErrorMessage("REGISTERED_USER_ACCESS_DENIED", messages)).toBe(
      "Access denied",
    );
  });

  // -- Lookup Failures --

  it("returns loadFailed for lookup failures", () => {
    expect(getCaseAccessErrorMessage("CASE_LOOKUP_FAILED", messages)).toBe("Load failed");
    expect(getCaseAccessErrorMessage("USER_LOOKUP_FAILED", messages)).toBe("Load failed");
    expect(getCaseAccessErrorMessage("TICKET_LOOKUP_FAILED", messages)).toBe("Load failed");
  });
});

describe("isCaseAccessValidationFailure", () => {
  it("returns true for validation failures", () => {
    expect(isCaseAccessValidationFailure("CASE_NOT_FOUND")).toBe(true);
    expect(isCaseAccessValidationFailure("USER_NOT_FOUND")).toBe(true);
    expect(isCaseAccessValidationFailure("REGISTERED_USER_ACCESS_DENIED")).toBe(true);
  });

  it("returns false for server failures", () => {
    expect(isCaseAccessValidationFailure("CASE_LOOKUP_FAILED")).toBe(false);
    expect(isCaseAccessValidationFailure("USER_LOOKUP_FAILED")).toBe(false);
    expect(isCaseAccessValidationFailure("TICKET_LOOKUP_FAILED")).toBe(false);
  });
});

describe("loadAccessibleCaseByReference", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // -- Case Lookup Failures --

  it("returns CASE_LOOKUP_FAILED when case lookup has errors", async () => {
    const client = makeClient({
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({
          data: [],
          errors: [{ message: "error" }],
        }),
      },
    });

    const result = await loadAccessibleCaseByReference(client, null, "ABC-DEF234", "test");
    expect(result).toEqual({ reason: "CASE_LOOKUP_FAILED" });
  });

  it("returns CASE_NOT_FOUND when no case matches", async () => {
    const client = makeClient({
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({ data: [], errors: undefined }),
      },
    });

    const result = await loadAccessibleCaseByReference(client, null, "ABC-DEF234", "test");
    expect(result).toEqual({ reason: "CASE_NOT_FOUND" });
  });

  // -- Staff Access --

  it("returns case record for staff without needing to be user linked to case", async () => {
    const caseRecord = { id: "case1", userId: "user1", referenceNumber: "ABC-DEF234" };
    const client = makeClient({
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({
          data: [caseRecord],
          errors: undefined,
        }),
      },
    });

    const result = await loadAccessibleCaseByReference(
      client,
      { groups: ["Staff"] },
      "ABC-DEF234",
      "test",
    );
    expect(result).toEqual({ caseRecord });
    expect(client.models.User.get).not.toHaveBeenCalled();
  });

  // -- User Lookup Failures --

  it("returns USER_LOOKUP_FAILED when user lookup has errors", async () => {
    const caseRecord = { id: "case1", userId: "user1", referenceNumber: "ABC-DEF234" };
    const client = makeClient({
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({
          data: [caseRecord],
          errors: undefined,
        }),
      },
      User: {
        get: vi.fn().mockResolvedValue({ data: null, errors: [{ message: "error" }] }),
      },
    });

    const result = await loadAccessibleCaseByReference(client, null, "ABC-DEF234", "test");
    expect(result).toEqual({ reason: "USER_LOOKUP_FAILED" });
  });

  it("returns USER_NOT_FOUND when user record is missing", async () => {
    const caseRecord = { id: "case1", userId: "user1", referenceNumber: "ABC-DEF234" };
    const client = makeClient({
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({
          data: [caseRecord],
          errors: undefined,
        }),
      },
      User: {
        get: vi.fn().mockResolvedValue({ data: null, errors: undefined }),
      },
    });

    const result = await loadAccessibleCaseByReference(client, null, "ABC-DEF234", "test");
    expect(result).toEqual({ reason: "USER_NOT_FOUND" });
  });

  // -- Access Control --

  it("returns REGISTERED_USER_ACCESS_DENIED for registered user with wrong sub", async () => {
    const caseRecord = { id: "case1", userId: "user1", referenceNumber: "ABC-DEF234" };
    const userRecord = { id: "user1", isRegistered: true };
    const client = makeClient({
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({
          data: [caseRecord],
          errors: undefined,
        }),
      },
      User: {
        get: vi.fn().mockResolvedValue({ data: userRecord, errors: undefined }),
      },
    });

    const result = await loadAccessibleCaseByReference(
      client,
      { sub: "wrong-user" },
      "ABC-DEF234",
      "test",
    );
    expect(result).toEqual({ reason: "REGISTERED_USER_ACCESS_DENIED" });
  });

  it("returns REGISTERED_USER_ACCESS_DENIED for guest user when case is linked to a registered user", async () => {
    const caseRecord = { id: "case1", userId: "user1", referenceNumber: "ABC-DEF234" };
    const userRecord = { id: "user1", isRegistered: true };
    const client = makeClient({
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({
          data: [caseRecord],
          errors: undefined,
        }),
      },
      User: {
        get: vi.fn().mockResolvedValue({ data: userRecord, errors: undefined }),
      },
    });

    const result = await loadAccessibleCaseByReference(client, null, "ABC-DEF234", "test");
    expect(result).toEqual({ reason: "REGISTERED_USER_ACCESS_DENIED" });
  });

  // -- Success Cases --

  it("returns case and user for registered user with matching sub", async () => {
    const caseRecord = { id: "case1", userId: "user1", referenceNumber: "ABC-DEF234" };
    const userRecord = { id: "user1", isRegistered: true };
    const client = makeClient({
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({
          data: [caseRecord],
          errors: undefined,
        }),
      },
      User: {
        get: vi.fn().mockResolvedValue({ data: userRecord, errors: undefined }),
      },
    });

    const result = await loadAccessibleCaseByReference(
      client,
      { sub: "user1" },
      "ABC-DEF234",
      "test",
    );
    expect(result).toEqual({ caseRecord, userRecord });
  });

  it("returns case and user for non-registered user (anyone can access)", async () => {
    const caseRecord = { id: "case1", userId: "user1", referenceNumber: "ABC-DEF234" };
    const userRecord = { id: "user1", isRegistered: false };
    const client = makeClient({
      Case: {
        listCaseByReferenceNumber: vi.fn().mockResolvedValue({
          data: [caseRecord],
          errors: undefined,
        }),
      },
      User: {
        get: vi.fn().mockResolvedValue({ data: userRecord, errors: undefined }),
      },
    });

    const result = await loadAccessibleCaseByReference(client, null, "ABC-DEF234", "test");
    expect(result).toEqual({ caseRecord, userRecord });
  });

  // -- Input Normalisation --

  it("normalises reference number to uppercase", async () => {
    const client = makeClient();

    await loadAccessibleCaseByReference(client, null, "  abc-def234  ", "test");
    expect(client.models.Case.listCaseByReferenceNumber).toHaveBeenCalledWith({
      referenceNumber: "ABC-DEF234",
    });
  });
});

describe("getHasActiveWaitingTicket", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // -- Lookup Failure --

  it("returns TICKET_LOOKUP_FAILED on errors", async () => {
    const client = makeClient({
      Ticket: {
        listTicketByCaseId: vi.fn().mockResolvedValue({
          data: [],
          errors: [{ message: "fail" }],
        }),
      },
    });

    const result = await getHasActiveWaitingTicket(client, "case1", "test");
    expect(result).toEqual({ reason: "TICKET_LOOKUP_FAILED" });
  });

  // -- Ticket Status Detection --

  it("returns hasActiveWaitingTicket: true when a WAITING ticket exists", async () => {
    const client = makeClient({
      Ticket: {
        listTicketByCaseId: vi.fn().mockResolvedValue({
          data: [{ status: "COMPLETED" }, { status: "WAITING" }],
          errors: undefined,
        }),
      },
    });

    const result = await getHasActiveWaitingTicket(client, "case1", "test");
    expect(result).toEqual({ hasActiveWaitingTicket: true });
  });

  it("returns hasActiveWaitingTicket: false when no WAITING tickets", async () => {
    const client = makeClient({
      Ticket: {
        listTicketByCaseId: vi.fn().mockResolvedValue({
          data: [{ status: "COMPLETED" }],
          errors: undefined,
        }),
      },
    });

    const result = await getHasActiveWaitingTicket(client, "case1", "test");
    expect(result).toEqual({ hasActiveWaitingTicket: false });
  });

  it("returns hasActiveWaitingTicket: false when no tickets", async () => {
    const client = makeClient();

    const result = await getHasActiveWaitingTicket(client, "case1", "test");
    expect(result).toEqual({ hasActiveWaitingTicket: false });
  });
});
