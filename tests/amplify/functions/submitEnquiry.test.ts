import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  mockUserGet,
  mockUserCreate,
  mockUserUpdate,
  mockUserDelete,
  mockCaseCreate,
  mockCaseDelete,
  mockCreateAppointmentSubmission,
  mockCreateQueueSubmission,
  mockCleanupCreatedVisitResources,
  mockClaimCaseReferenceNumber,
  mockReleaseCaseReferenceNumber,
} = vi.hoisted(() => ({
  mockUserGet: vi.fn(),
  mockUserCreate: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockUserDelete: vi.fn(),
  mockCaseCreate: vi.fn(),
  mockCaseDelete: vi.fn(),
  mockCreateAppointmentSubmission: vi.fn(),
  mockCreateQueueSubmission: vi.fn(),
  mockCleanupCreatedVisitResources: vi.fn(),
  mockClaimCaseReferenceNumber: vi.fn(),
  mockReleaseCaseReferenceNumber: vi.fn(),
}));

vi.mock("aws-amplify/data", () => ({ generateClient: vi.fn() }));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      User: {
        get: mockUserGet,
        create: mockUserCreate,
        update: mockUserUpdate,
        delete: mockUserDelete,
      },
      Case: { create: mockCaseCreate, delete: mockCaseDelete },
    },
  }),
}));

vi.mock("../../../shared/formSchema", () => ({
  formSchema: {
    safeParse: (input: any) => {
      if (!input?.firstName) return { success: false, error: { issues: [{ message: "fail" }] } };
      return { success: true, data: input };
    },
  },
}));

vi.mock("../../../amplify/functions/utils/enquiriesStateTable", () => ({
  claimCaseReferenceNumber: mockClaimCaseReferenceNumber,
  releaseCaseReferenceNumber: mockReleaseCaseReferenceNumber,
}));

vi.mock("../../../amplify/functions/utils/submissionShared", () => ({
  createAppointmentSubmission: mockCreateAppointmentSubmission,
  createQueueSubmission: mockCreateQueueSubmission,
  cleanupCreatedVisitResources: mockCleanupCreatedVisitResources,
  getErrorName: (e: any) =>
    e && typeof e === "object" && typeof e.name === "string" ? e.name : "",
}));

vi.mock("../../../amplify/functions/utils/identityGroups", () => ({
  getIdentityGroups: (id: any) => id?.groups ?? [],
  getIdentitySub: (id: any) => id?.sub ?? null,
}));

vi.mock("../../../amplify/functions/utils/runCleanup", () => ({
  logModelErrors: vi.fn(),
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

vi.mock("../../../shared/referenceNumbers", () => ({
  CASE_REFERENCE_LETTERS: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  CASE_REFERENCE_CHARS: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
}));

import {
  handler as _handler,
  generateCaseReferenceNumber,
} from "../../../amplify/functions/submitEnquiry/handler";

const handler = _handler as (event: any) => Promise<any>;

const makeEvent = (input: unknown, identity: unknown = null) =>
  ({ arguments: { input }, identity }) as any;

const validInput = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+447700900000",
  departmentName: "Homelessness",
  enquiry: "Need help",
  proceed: "JOIN_DIGITAL_QUEUE",
};

const conditionalCheckError = () => {
  const err = new Error("duplicate");
  err.name = "ConditionalCheckFailedException";
  return err;
};

describe("generateCaseReferenceNumber", () => {
  it("generates reference in correct format", () => {
    const ref = generateCaseReferenceNumber();
    expect(ref).toMatch(/^[A-Z]{3}-[A-Z0-9]{6}$/);
    expect(ref).not.toMatch(/[IO01]/);
  });

  it("generates unique references", () => {
    const refs = new Set(Array.from({ length: 20 }, generateCaseReferenceNumber));
    expect(refs.size).toBeGreaterThan(1);
  });
});

describe("submitEnquiry handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    mockClaimCaseReferenceNumber.mockResolvedValue(undefined);
    mockCaseCreate.mockResolvedValue({ data: { id: "case1" }, errors: undefined });
    mockUserCreate.mockResolvedValue({ data: { id: "user1" }, errors: undefined });
    mockUserGet.mockResolvedValue({ data: null, errors: undefined });
    mockCreateQueueSubmission.mockResolvedValue({
      ok: true,
      ticketNumber: "H001",
      estimatedWaitTimeLower: 10,
      estimatedWaitTimeUpper: 20,
    });
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore?.();
    vi.mocked(console.warn).mockRestore?.();
  });

  // -- Validation --

  it("rejects invalid input with VALIDATION error", async () => {
    const result = await handler(makeEvent(null));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("VALIDATION");
    expect(result?.errorMessage).toBe("Please check your answers and try again.");
  });

  // -- Successful submission --

  it("creates guest user and case for guest submission", async () => {
    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(true);
    expect(result?.referenceNumber).toBeDefined();
    expect(result?.ticketNumber).toBe("H001");
    expect(mockUserCreate).toHaveBeenCalled();
    expect(mockCaseCreate).toHaveBeenCalled();
  });

  it("defaults the case title to first name and last name", async () => {
    const result = await handler(makeEvent(validInput));

    expect(result?.ok).toBe(true);

    const caseInput = mockCaseCreate.mock.calls[0][0];
    expect(caseInput.name).toBe(`${validInput.firstName} ${validInput.lastName}`);
  });

  it("serialises supportNeeds to JSON for the case", async () => {
    const result = await handler(
      makeEvent({ ...validInput, supportNeeds: ["ACCESSIBILITY", "LANGUAGE"] }),
    );
    expect(result?.ok).toBe(true);
    const caseInput = mockCaseCreate.mock.calls[0][0];
    expect(caseInput.supportNeedsJson).toBe(JSON.stringify(["ACCESSIBILITY", "LANGUAGE"]));
  });

  // -- User resolution --

  it("reuses existing user when signed in as resident", async () => {
    mockUserGet.mockResolvedValue({
      data: { id: "user-sub", isRegistered: true },
      errors: undefined,
    });
    mockUserUpdate.mockResolvedValue({ errors: undefined });

    const result = await handler(makeEvent(validInput, { sub: "user-sub" }));
    expect(result?.ok).toBe(true);
    expect(mockUserGet).toHaveBeenCalledWith({ id: "user-sub" });
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockUserUpdate).toHaveBeenCalled();
  });

  it("still succeeds when User.update fails on existing user", async () => {
    mockUserGet.mockResolvedValue({
      data: { id: "user-sub", isRegistered: true },
      errors: undefined,
    });
    mockUserUpdate.mockResolvedValue({ errors: [{ message: "update failed" }] });

    const result = await handler(makeEvent(validInput, { sub: "user-sub" }));
    expect(result?.ok).toBe(true);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("skips User.update when no fields to update", async () => {
    mockUserGet.mockResolvedValue({
      data: { id: "user-sub", isRegistered: true },
      errors: undefined,
    });

    const inputWithBlankDetails = {
      ...validInput,
      firstName: " ",
      lastName: " ",
      email: " ",
      phone: " ",
      middleName: "",
      preferredName: "",
      pronouns: "",
      pronounsOtherText: "",
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      townOrCity: "",
      postcode: "",
    };
    const result = await handler(makeEvent(inputWithBlankDetails, { sub: "user-sub" }));
    expect(result?.ok).toBe(true);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("falls back to create guest user when User.get throws", async () => {
    mockUserGet.mockRejectedValue(new Error("error"));

    const result = await handler(makeEvent(validInput, { sub: "user-sub" }));
    expect(result?.ok).toBe(true);
    expect(mockUserCreate).toHaveBeenCalled();
  });

  it("falls back to create guest user when User.get returns no data", async () => {
    mockUserGet.mockResolvedValue({ data: null, errors: undefined });

    const result = await handler(makeEvent(validInput, { sub: "user-sub" }));
    expect(result?.ok).toBe(true);
    expect(mockUserCreate).toHaveBeenCalled();
  });

  it("creates separate guest user for staff submissions", async () => {
    const result = await handler(makeEvent(validInput, { sub: "staff-sub", groups: ["Staff"] }));
    expect(result?.ok).toBe(true);
    expect(mockUserCreate).toHaveBeenCalled();
    expect(mockUserGet).not.toHaveBeenCalled();
  });

  it("creates separate guest user for HounslowHouseDevices submissions", async () => {
    const result = await handler(
      makeEvent(validInput, { sub: "device-sub", groups: ["HounslowHouseDevices"] }),
    );
    expect(result?.ok).toBe(true);
    expect(mockUserCreate).toHaveBeenCalled();
    expect(mockUserGet).not.toHaveBeenCalled();
  });

  it("returns SERVER error when guest user creation fails", async () => {
    mockUserCreate.mockResolvedValue({ data: null, errors: [{ message: "fail" }] });

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
  });

  // -- Reference number allocation --

  it("retries reference allocation on ConditionalCheckFailedException", async () => {
    mockClaimCaseReferenceNumber
      .mockRejectedValueOnce(conditionalCheckError())
      .mockRejectedValueOnce(conditionalCheckError())
      .mockResolvedValueOnce(undefined);

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(true);
    expect(mockClaimCaseReferenceNumber).toHaveBeenCalledTimes(3);
  });

  it("returns SERVER error when all 10 reference allocation attempts fail", async () => {
    mockClaimCaseReferenceNumber.mockRejectedValue(conditionalCheckError());

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
    expect(mockClaimCaseReferenceNumber).toHaveBeenCalledTimes(10);
  });

  it("returns SERVER error for non-conditional-check errors during reference allocation", async () => {
    mockClaimCaseReferenceNumber.mockRejectedValue(new Error("DynamoDB timeout"));

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
    expect(mockClaimCaseReferenceNumber).toHaveBeenCalledTimes(1);
  });

  // -- Queue submission --

  it("returns ticket number and wait times on successful queue submission", async () => {
    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(true);
    expect(result?.ticketNumber).toBe("H001");
    expect(result?.estimatedWaitTimeLower).toBe(10);
    expect(result?.estimatedWaitTimeUpper).toBe(20);
    expect(result?.referenceNumber).toBeDefined();
  });

  it("returns CAPACITY error when queue is full", async () => {
    mockCreateQueueSubmission.mockResolvedValue({
      ok: false,
      errorCode: "CAPACITY",
      errorMessage: "Queue full",
    });

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("CAPACITY");
    expect(result?.errorMessage).toBe("Queue full");
  });

  // -- Appointment submission --

  it("books appointment and returns booking reference", async () => {
    mockCreateAppointmentSubmission.mockResolvedValue({
      ok: true,
      bookingReferenceNumber: "APT-ABC234",
    });

    const result = await handler(
      makeEvent({
        ...validInput,
        proceed: "BOOK_APPOINTMENT",
        appointmentDateIso: "2025-03-18",
        appointmentTime: "09:00",
      }),
    );
    expect(result?.ok).toBe(true);
    expect(result?.bookingReferenceNumber).toBe("APT-ABC234");
    expect(result?.referenceNumber).toBeDefined();
  });

  it("returns CONFLICT error and cleans up when appointment slot is taken", async () => {
    mockCreateAppointmentSubmission.mockResolvedValue({
      ok: false,
      errorCode: "CONFLICT",
      errorMessage: "Slot unavailable",
    });
    mockCaseDelete.mockResolvedValue({ errors: undefined });

    const result = await handler(
      makeEvent({
        ...validInput,
        proceed: "BOOK_APPOINTMENT",
        appointmentDateIso: "2025-03-18",
        appointmentTime: "09:00",
      }),
    );
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("CONFLICT");
    expect(result?.errorMessage).toBe("Slot unavailable");
    expect(mockCleanupCreatedVisitResources).toHaveBeenCalled();
    expect(mockCaseDelete).toHaveBeenCalledWith({ id: "case1" });
  });

  // -- Cleanup on failure --

  it("cleans up visit resources on case creation failure", async () => {
    mockCaseCreate.mockResolvedValue({ data: null, errors: [{ message: "fail" }] });

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(result?.errorCode).toBe("SERVER");
    expect(mockCleanupCreatedVisitResources).toHaveBeenCalled();
  });

  it("deletes created case and releases reference on failure", async () => {
    mockCreateQueueSubmission.mockRejectedValue(new Error("ticket crash"));
    mockCaseDelete.mockResolvedValue({ errors: undefined });

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(mockCaseDelete).toHaveBeenCalledWith({ id: "case1" });
    expect(mockReleaseCaseReferenceNumber).toHaveBeenCalled();
  });

  it("skips reference release when case delete fails", async () => {
    mockCreateQueueSubmission.mockRejectedValue(new Error("ticket crash"));
    mockCaseDelete.mockRejectedValue(new Error("delete failed"));

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(mockReleaseCaseReferenceNumber).not.toHaveBeenCalled();
  });

  it("deletes guest user on failure", async () => {
    mockCreateQueueSubmission.mockRejectedValue(new Error("ticket crash"));
    mockCaseDelete.mockResolvedValue({ errors: undefined });

    const result = await handler(makeEvent(validInput));
    expect(result?.ok).toBe(false);
    expect(mockUserDelete).toHaveBeenCalledWith({ id: "user1" });
  });

  it("does not delete existing user on failure", async () => {
    mockUserGet.mockResolvedValue({
      data: { id: "user-sub", isRegistered: true },
      errors: undefined,
    });
    mockUserUpdate.mockResolvedValue({ errors: undefined });
    mockCreateQueueSubmission.mockRejectedValue(new Error("ticket crash"));
    mockCaseDelete.mockResolvedValue({ errors: undefined });

    await handler(makeEvent(validInput, { sub: "user-sub" }));
    expect(mockUserDelete).not.toHaveBeenCalled();
  });
});
