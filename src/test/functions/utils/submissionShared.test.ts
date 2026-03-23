import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockDdbSend, mockUpdateItemCommand } = vi.hoisted(() => ({
  mockDdbSend: vi.fn(),
  mockUpdateItemCommand: vi.fn(),
}));

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: vi.fn(function() { return { send: mockDdbSend }; }),
  UpdateItemCommand: mockUpdateItemCommand,
}));

vi.mock("aws-amplify/data", () => ({
  generateClient: vi.fn(),
}));

vi.mock("../../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn(),
}));

vi.mock("../../../../amplify/functions/utils/enquiriesStateTable", () => ({
  claimAppointmentSlot: vi.fn(),
  releaseAppointmentSlot: vi.fn(),
  releaseBookingReferenceNumber: vi.fn(),
  releaseQueuePosition: vi.fn(),
  releaseTicketNumber: vi.fn(),
  claimBookingReferenceNumber: vi.fn(),
  claimQueuePosition: vi.fn().mockResolvedValue(0),
  claimTicketDigits: vi.fn(),
  daysFromNowInSeconds: vi.fn().mockReturnValue(9999),
  getDate: vi.fn().mockReturnValue("20260615"),
  getEnquiriesStateTableName: vi.fn().mockReturnValue("test-table"),
  markAppointmentSlotBooked: vi.fn(),
}));

vi.mock("../../../../amplify/functions/utils/queueWaitTimes", () => ({
  getDefaultEstimatedWaitingTime: vi.fn().mockReturnValue(15),
  getEstimatedWaitTimeBounds: vi.fn().mockReturnValue({ lower: 10, upper: 20 }),
}));

vi.mock("../../../../amplify/functions/utils/runCleanup", () => ({
  logModelErrors: vi.fn(),
  runCleanup: vi.fn().mockResolvedValue({ errors: undefined }),
  tryCleanup: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../../../shared/departmentCodes", () => ({
  DepartmentCodeByName: {
    Homelessness: "H",
    Adults_Duty: "A",
    General_Customer_Services: "G",
  },
}));

import {
  getErrorName,
  allocateBookingReferenceNumber,
  allocateDeptTicketNumber,
  createCaseUpdate,
  getCaseAppointmentCount,
  createAppointmentSubmission,
  createQueueSubmission,
  cleanupCreatedVisitResources,
  APPOINTMENT_SLOT_UNAVAILABLE_MESSAGE,
  type CreatedVisitResourcesState,
} from "../../../../amplify/functions/utils/submissionShared";
import type { AmplifyClient } from "../../../../amplify/functions/utils/amplifyClient";
import {
  claimAppointmentSlot,
  claimBookingReferenceNumber,
  claimQueuePosition,
  claimTicketDigits,
  daysFromNowInSeconds,
  getDate,
  getEnquiriesStateTableName,
  markAppointmentSlotBooked,
  releaseAppointmentSlot,
  releaseBookingReferenceNumber,
  releaseQueuePosition,
  releaseTicketNumber,
} from "../../../../amplify/functions/utils/enquiriesStateTable";
import {
  getDefaultEstimatedWaitingTime,
  getEstimatedWaitTimeBounds,
} from "../../../../amplify/functions/utils/queueWaitTimes";
import {
  logModelErrors,
  runCleanup,
  tryCleanup,
} from "../../../../amplify/functions/utils/runCleanup";

type ClientOverrides = {
  Appointment?: Record<string, unknown>;
  Ticket?: Record<string, unknown>;
  Department?: Record<string, unknown>;
  CaseUpdate?: Record<string, unknown>;
};

function makeClient(overrides: ClientOverrides = {}) {
  return {
    models: {
      Appointment: {
        create: vi.fn().mockResolvedValue({ data: { id: "apt1" }, errors: undefined }),
        delete: vi.fn().mockResolvedValue({ errors: undefined }),
        listAppointmentByCaseId: vi.fn().mockResolvedValue({ data: [], errors: undefined }),
        ...(overrides.Appointment ?? {}),
      },
      Ticket: {
        create: vi.fn().mockResolvedValue({
          data: { id: "ticket1" },
          errors: undefined,
        }),
        delete: vi.fn().mockResolvedValue({ errors: undefined }),
        ...(overrides.Ticket ?? {}),
      },
      Department: {
        get: vi.fn().mockResolvedValue({ data: null, errors: undefined }),
        ...(overrides.Department ?? {}),
      },
      CaseUpdate: {
        create: vi.fn().mockResolvedValue({ data: { id: "update1" }, errors: undefined }),
        ...(overrides.CaseUpdate ?? {}),
      },
    },
  } as unknown as AmplifyClient;
}

function makeVisitState(): CreatedVisitResourcesState {
  return {
    createdTicketId: null,
    claimedQueueId: null,
    claimedTicketDigits: null,
    claimedQueuePositionKey: null,
    createdAppointmentId: null,
    claimedAppointmentSlot: null,
    claimedBookingReferenceNumber: null,
  };
}

function restoreMockDefaults() {
  vi.mocked(daysFromNowInSeconds).mockReturnValue(9999);
  vi.mocked(getDate).mockReturnValue("20260615");
  vi.mocked(getEnquiriesStateTableName).mockReturnValue("test-table");
  vi.mocked(claimQueuePosition).mockResolvedValue(0);
  vi.mocked(getDefaultEstimatedWaitingTime).mockReturnValue(15);
  vi.mocked(getEstimatedWaitTimeBounds).mockReturnValue({ lower: 10, upper: 20 });
  vi.mocked(runCleanup).mockImplementation(
    async (
      _failureLogPrefix: string,
      failureMessage: string,
      fn: () => Promise<{ data: unknown | null; errors?: unknown[] | undefined }>,
    ) => {
      const result = await fn();
      if (result.errors?.length) {
        throw new Error(failureMessage);
      }
      return result;
    },
  );
  vi.mocked(tryCleanup).mockImplementation(
    async (_logPrefix: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
        return true;
      } catch {
        return false;
      }
    },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

// -- Error Handling --

describe("getErrorName", () => {
  it("returns name for Error objects", () => {
    const err = new Error("test");
    err.name = "ConditionalCheckFailedException";
    expect(getErrorName(err)).toBe("ConditionalCheckFailedException");
  });

  it("returns empty string for non-Error or invalid name values", () => {
    expect(getErrorName(null)).toBe("");
    expect(getErrorName(undefined)).toBe("");
    expect(getErrorName("string")).toBe("");
    expect(getErrorName(42)).toBe("");
    expect(getErrorName({ name: 123 })).toBe("");
  });
});

// -- Booking Reference Allocation --

describe("allocateBookingReferenceNumber", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    restoreMockDefaults();
  });

  it("returns a booking reference number in the correct format", async () => {
    const ref = await allocateBookingReferenceNumber();
    expect(ref).toMatch(/^APT-[ABCDEFGHJKLMNPQRSTUVWXYZ]{3}[23456789]{3}$/);
  });

  it("retries on ConditionalCheckFailedException", async () => {
    const error = new Error("duplicate");
    error.name = "ConditionalCheckFailedException";
    vi.mocked(claimBookingReferenceNumber)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(undefined);

    const ref = await allocateBookingReferenceNumber();
    expect(ref).toMatch(/^APT-/);
    expect(claimBookingReferenceNumber).toHaveBeenCalledTimes(3);
  });

  it("throws after 10 failed attempts", async () => {
    const error = new Error("duplicate");
    error.name = "ConditionalCheckFailedException";
    vi.mocked(claimBookingReferenceNumber).mockRejectedValue(error);

    await expect(allocateBookingReferenceNumber()).rejects.toThrow(
      "Failed to allocate a unique booking reference",
    );
    expect(claimBookingReferenceNumber).toHaveBeenCalledTimes(10);
  });

  it("rethrows non-conditional errors", async () => {
    vi.mocked(claimBookingReferenceNumber).mockRejectedValue(new Error("network"));
    await expect(allocateBookingReferenceNumber()).rejects.toThrow("network");
  });
});

// -- Ticket Number Allocation --

describe("allocateDeptTicketNumber", () => {
  let previousEnquiriesStateTable: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    restoreMockDefaults();
    previousEnquiriesStateTable = process.env.ENQUIRIES_STATE_TABLE;
    process.env.ENQUIRIES_STATE_TABLE = "test-table";
    mockDdbSend.mockResolvedValue({
      Attributes: { next: { N: "1" } },
    });
  });

  afterEach(() => {
    if (previousEnquiriesStateTable === undefined) {
      delete process.env.ENQUIRIES_STATE_TABLE;
    } else {
      process.env.ENQUIRIES_STATE_TABLE = previousEnquiriesStateTable;
    }
  });

  it("returns ok result with ticket number for valid department", async () => {
    const result = await allocateDeptTicketNumber("Homelessness");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ticketNumber).toMatch(/^H\d{3}$/);
    }
  });

  it("throws for invalid department name", async () => {
    await expect(allocateDeptTicketNumber("Invalid")).rejects.toThrow(
      "No department code configured",
    );
  });

  it("returns CAPACITY error after 1000 collision attempts", async () => {
    const error = new Error("dup");
    error.name = "ConditionalCheckFailedException";
    vi.mocked(claimTicketDigits).mockRejectedValue(error);

    const result = await allocateDeptTicketNumber("Homelessness");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe("CAPACITY");
    }
  });

  it("throws when the ticket counter response is invalid", async () => {
    mockDdbSend.mockResolvedValueOnce({ Attributes: {} });

    await expect(allocateDeptTicketNumber("Homelessness")).rejects.toThrow(
      "Ticket counter did not return a valid value",
    );
  });

  it("rethrows non-conditional ticket claim errors", async () => {
    vi.mocked(claimTicketDigits).mockRejectedValueOnce(new Error("ddb down"));

    await expect(allocateDeptTicketNumber("Homelessness")).rejects.toThrow("ddb down");
  });
});

// -- Case Updates --

describe("createCaseUpdate", () => {
  it("returns the created update id", async () => {
    const client = makeClient();
    const id = await createCaseUpdate({
      client,
      caseId: "case1",
      content: "some update",
      logPrefix: "test",
    });
    expect(id).toBe("update1");
  });

  it("throws when creation fails", async () => {
    const client = makeClient();
    vi.mocked(client.models.CaseUpdate.create).mockResolvedValue({
      data: null,
      errors: [{ message: "fail" }],
    });
    await expect(
      createCaseUpdate({ client, caseId: "case1", content: "update", logPrefix: "test" }),
    ).rejects.toThrow("Failed to create case update");
  });
});

// -- Appointment Count --

describe("getCaseAppointmentCount", () => {
  it("returns count of SCHEDULED appointments", async () => {
    const client = makeClient();
    vi.mocked(client.models.Appointment.listAppointmentByCaseId).mockResolvedValue({
      data: [{ status: "SCHEDULED" }, { status: "CANCELLED" }, { status: "SCHEDULED" }],
      errors: undefined,
    });
    const count = await getCaseAppointmentCount(client, "case1", "test");
    expect(count).toBe(2);
  });

  it("returns null on error", async () => {
    const client = makeClient();
    vi.mocked(client.models.Appointment.listAppointmentByCaseId).mockResolvedValue({
      data: [],
      errors: [{ message: "fail" }],
    });
    const count = await getCaseAppointmentCount(client, "case1", "test");
    expect(count).toBeNull();
  });

  it("returns 0 when no appointments", async () => {
    const client = makeClient();
    const count = await getCaseAppointmentCount(client, "case1", "test");
    expect(count).toBe(0);
  });
});

// -- Appointment Submission --

describe("createAppointmentSubmission", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    restoreMockDefaults();
  });

  it("returns ok with booking reference on success", async () => {
    const client = makeClient();
    const visitState = makeVisitState();
    const result = await createAppointmentSubmission({
      client,
      caseId: "case1",
      userId: "user1",
      departmentName: "Homelessness",
      appointmentDateIso: "2026-06-15",
      appointmentTime: "09:00",
      logPrefix: "test",
      visitState,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected successful appointment submission");
    }
    expect(result.bookingReferenceNumber).toBeDefined();
    expect(visitState.claimedBookingReferenceNumber).toBe(result.bookingReferenceNumber);
    expect(visitState.claimedAppointmentSlot).toEqual({
      departmentName: "Homelessness",
      dateIso: "2026-06-15",
      time: "09:00",
    });
    expect(visitState.createdAppointmentId).toBe("apt1");
    expect(markAppointmentSlotBooked).toHaveBeenCalledWith({
      departmentName: "Homelessness",
      dateIso: "2026-06-15",
      time: "09:00",
    });
  });

  it("returns CONFLICT when slot is already claimed", async () => {
    const error = new Error("dup");
    error.name = "ConditionalCheckFailedException";
    vi.mocked(claimAppointmentSlot).mockRejectedValueOnce(error);

    const client = makeClient();
    const visitState = makeVisitState();
    const result = await createAppointmentSubmission({
      client,
      caseId: "case1",
      userId: "user1",
      departmentName: "Homelessness",
      appointmentDateIso: "2026-06-15",
      appointmentTime: "09:00",
      logPrefix: "test",
      visitState,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe("CONFLICT");
      expect(result.errorMessage).toBe(APPOINTMENT_SLOT_UNAVAILABLE_MESSAGE);
    }
  });

  it("rethrows non-conditional appointment slot claim errors", async () => {
    vi.mocked(claimAppointmentSlot).mockRejectedValueOnce(new Error("ddb down"));

    const client = makeClient();
    const visitState = makeVisitState();

    await expect(
      createAppointmentSubmission({
        client,
        caseId: "case1",
        userId: "user1",
        departmentName: "Homelessness",
        appointmentDateIso: "2026-06-15",
        appointmentTime: "09:00",
        logPrefix: "test",
        visitState,
      }),
    ).rejects.toThrow("ddb down");
  });

  it("throws when appointment creation fails", async () => {
    const client = makeClient();
    vi.mocked(client.models.Appointment.create).mockResolvedValue({
      data: null,
      errors: [{ message: "fail" }],
    });
    const visitState = makeVisitState();

    await expect(
      createAppointmentSubmission({
        client,
        caseId: "case1",
        userId: "user1",
        departmentName: "Homelessness",
        appointmentDateIso: "2026-06-15",
        appointmentTime: "09:00",
        logPrefix: "test",
        visitState,
      }),
    ).rejects.toThrow("Failed to book appointment");
    expect(markAppointmentSlotBooked).not.toHaveBeenCalled();
    expect(logModelErrors).toHaveBeenCalledWith("test: Appointment.create failed", [
      { message: "fail" },
    ]);
  });

  it("rethrows when marking the appointment slot as booked fails", async () => {
    vi.mocked(markAppointmentSlotBooked).mockRejectedValueOnce(new Error("mark failed"));

    const client = makeClient();
    const visitState = makeVisitState();

    await expect(
      createAppointmentSubmission({
        client,
        caseId: "case1",
        userId: "user1",
        departmentName: "Homelessness",
        appointmentDateIso: "2026-06-15",
        appointmentTime: "09:00",
        logPrefix: "test",
        visitState,
      }),
    ).rejects.toThrow("mark failed");
    expect(visitState.createdAppointmentId).toBe("apt1");
  });
});

// -- Queue Submission --

describe("createQueueSubmission", () => {
  let previousEnquiriesStateTable: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    restoreMockDefaults();
    previousEnquiriesStateTable = process.env.ENQUIRIES_STATE_TABLE;
    process.env.ENQUIRIES_STATE_TABLE = "test-table";
    mockDdbSend.mockResolvedValue({
      Attributes: { next: { N: "1" } },
    });
  });

  afterEach(() => {
    if (previousEnquiriesStateTable === undefined) {
      delete process.env.ENQUIRIES_STATE_TABLE;
    } else {
      process.env.ENQUIRIES_STATE_TABLE = previousEnquiriesStateTable;
    }
  });

  it("returns ok with ticket number on success", async () => {
    const client = makeClient();
    const visitState = makeVisitState();
    const result = await createQueueSubmission({
      client,
      caseId: "case1",
      departmentName: "Homelessness",
      logPrefix: "test",
      visitState,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ticketNumber).toBeDefined();
      expect(result.estimatedWaitTimeLower).toBeDefined();
      expect(result.estimatedWaitTimeUpper).toBeDefined();
    }
    expect(visitState.createdTicketId).toBe("ticket1");
  });

  it("returns CAPACITY when ticket allocation is exhausted", async () => {
    const error = new Error("dup");
    error.name = "ConditionalCheckFailedException";
    vi.mocked(claimTicketDigits).mockRejectedValue(error);

    const client = makeClient();
    const visitState = makeVisitState();

    const result = await createQueueSubmission({
      client,
      caseId: "case1",
      departmentName: "Homelessness",
      logPrefix: "test",
      visitState,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe("CAPACITY");
    }
    expect(claimQueuePosition).not.toHaveBeenCalled();
    expect(client.models.Ticket.create).not.toHaveBeenCalled();
  });

  it("uses the department estimated waiting time when available", async () => {
    const client = makeClient();
    vi.mocked(client.models.Department.get).mockResolvedValue({
      data: { id: "Homelessness", name: "Homelessness", estimatedWaitingTime: 45 },
      errors: undefined,
    });
    const visitState = makeVisitState();

    await createQueueSubmission({
      client,
      caseId: "case1",
      departmentName: "Homelessness",
      logPrefix: "test",
      visitState,
    });

    expect(getEstimatedWaitTimeBounds).toHaveBeenCalledWith(0, 45);
  });

  it("logs department lookup errors and falls back to the default wait time", async () => {
    const client = makeClient();
    vi.mocked(client.models.Department.get).mockResolvedValue({
      data: { id: "Homelessness", name: "Homelessness", estimatedWaitingTime: null },
      errors: [{ message: "lookup failed" }],
    });
    const visitState = makeVisitState();

    await createQueueSubmission({
      client,
      caseId: "case1",
      departmentName: "Homelessness",
      logPrefix: "test",
      visitState,
    });

    expect(logModelErrors).toHaveBeenCalledWith("test: Department.get failed", [
      { message: "lookup failed" },
    ]);
    expect(getDefaultEstimatedWaitingTime).toHaveBeenCalledWith("Homelessness");
  });

  it("falls back to the default wait time when department lookup throws", async () => {
    const client = makeClient();
    vi.mocked(client.models.Department.get).mockRejectedValue(new Error("failed"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const visitState = makeVisitState();

    await createQueueSubmission({
      client,
      caseId: "case1",
      departmentName: "Homelessness",
      logPrefix: "test",
      visitState,
    });

    expect(consoleError).toHaveBeenCalledWith("test: Department.get failed", expect.any(Error));
    expect(getEstimatedWaitTimeBounds).toHaveBeenCalledWith(0, 15);
  });

  it("throws when ticket creation fails", async () => {
    const client = makeClient();
    vi.mocked(client.models.Ticket.create).mockResolvedValue({
      data: null,
      errors: [{ message: "fail" }],
    });
    const visitState = makeVisitState();

    await expect(
      createQueueSubmission({
        client,
        caseId: "case1",
        departmentName: "Homelessness",
        logPrefix: "test",
        visitState,
      }),
    ).rejects.toThrow("Failed to create ticket");
    expect(logModelErrors).toHaveBeenCalledWith("test: Ticket.create failed", [
      { message: "fail" },
    ]);
  });
});

// -- Cleanup --

describe("cleanupCreatedVisitResources", () => {
  let previousEnquiriesStateTable: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    restoreMockDefaults();
    previousEnquiriesStateTable = process.env.ENQUIRIES_STATE_TABLE;
    process.env.ENQUIRIES_STATE_TABLE = "test-table";
  });

  afterEach(() => {
    if (previousEnquiriesStateTable === undefined) {
      delete process.env.ENQUIRIES_STATE_TABLE;
    } else {
      process.env.ENQUIRIES_STATE_TABLE = previousEnquiriesStateTable;
    }
  });

  it("does not call tryCleanup or runCleanup when no resources have been created or claimed", async () => {
    const client = makeClient();
    await cleanupCreatedVisitResources(client, makeVisitState(), "test");
    expect(tryCleanup).not.toHaveBeenCalled();
    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("calls tryCleanup for ticket, ticket number, and queue position when ticket state is set", async () => {
    const client = makeClient();
    const state: CreatedVisitResourcesState = {
      ...makeVisitState(),
      createdTicketId: "ticket1",
      claimedQueueId: "q1",
      claimedTicketDigits: "001",
      claimedQueuePositionKey: "qp1",
    };
    await cleanupCreatedVisitResources(client, state, "test");

    // Ticket delete
    expect(tryCleanup).toHaveBeenCalledWith(
      expect.stringContaining("cleanup Ticket.delete failed"),
      expect.any(Function),
    );

    // Ticket number release
    expect(tryCleanup).toHaveBeenCalledWith(
      expect.stringContaining("cleanup TicketNumberClaims.delete failed"),
      expect.any(Function),
    );

    // Queue position release
    expect(tryCleanup).toHaveBeenCalledWith(
      expect.stringContaining("cleanup QueuePositionCounter.update failed"),
      expect.any(Function),
    );

    expect(tryCleanup).toHaveBeenCalledTimes(3);
    expect(client.models.Ticket.delete).toHaveBeenCalledWith({ id: "ticket1" });
    expect(releaseTicketNumber).toHaveBeenCalledWith("q1", "001");
    expect(releaseQueuePosition).toHaveBeenCalledWith("qp1");
  });

  it("releases ticket number and queue position when ticket claims exist but no ticket was created", async () => {
    const client = makeClient();
    const state: CreatedVisitResourcesState = {
      ...makeVisitState(),
      claimedQueueId: "q1",
      claimedTicketDigits: "001",
      claimedQueuePositionKey: "qp1",
    };
    await cleanupCreatedVisitResources(client, state, "test");

    expect(client.models.Ticket.delete).not.toHaveBeenCalled();
    expect(tryCleanup).toHaveBeenCalledTimes(2);
    expect(releaseTicketNumber).toHaveBeenCalledWith("q1", "001");
    expect(releaseQueuePosition).toHaveBeenCalledWith("qp1");
  });

  it("calls tryCleanup for appointment, slot, and booking reference when appointment state is set", async () => {
    const client = makeClient();
    const state: CreatedVisitResourcesState = {
      ...makeVisitState(),
      createdAppointmentId: "apt1",
      claimedAppointmentSlot: {
        departmentName: "Homelessness",
        dateIso: "2026-06-15",
        time: "09:00",
      },
      claimedBookingReferenceNumber: "APT-ABC234",
    };
    await cleanupCreatedVisitResources(client, state, "test");

    // Appointment delete
    expect(tryCleanup).toHaveBeenCalledWith(
      expect.stringContaining("cleanup Appointment.delete failed"),
      expect.any(Function),
    );

    // Appointment slot release
    expect(tryCleanup).toHaveBeenCalledWith(
      expect.stringContaining("cleanup AppointmentSlotClaims.delete failed"),
      expect.any(Function),
    );

    // Booking reference number release
    expect(tryCleanup).toHaveBeenCalledWith(
      expect.stringContaining("cleanup BookingReferenceClaims.delete failed"),
      expect.any(Function),
    );

    expect(tryCleanup).toHaveBeenCalledTimes(3);
    expect(client.models.Appointment.delete).toHaveBeenCalledWith({ id: "apt1" });
    expect(releaseAppointmentSlot).toHaveBeenCalledWith({
      departmentName: "Homelessness",
      dateIso: "2026-06-15",
      time: "09:00",
    });
    expect(releaseBookingReferenceNumber).toHaveBeenCalledWith("APT-ABC234");
  });

  it("releases appointment slot and booking reference when claims exist but no appointment was created", async () => {
    const client = makeClient();
    const state: CreatedVisitResourcesState = {
      ...makeVisitState(),
      claimedAppointmentSlot: {
        departmentName: "Homelessness",
        dateIso: "2026-06-15",
        time: "09:00",
      },
      claimedBookingReferenceNumber: "APT-ABC234",
    };
    await cleanupCreatedVisitResources(client, state, "test");

    expect(client.models.Appointment.delete).not.toHaveBeenCalled();
    expect(tryCleanup).toHaveBeenCalledTimes(2);
    expect(releaseAppointmentSlot).toHaveBeenCalledWith({
      departmentName: "Homelessness",
      dateIso: "2026-06-15",
      time: "09:00",
    });
    expect(releaseBookingReferenceNumber).toHaveBeenCalledWith("APT-ABC234");
  });

  it("skips ticket number and queue position release when ticket delete fails", async () => {
    const client = makeClient();
    vi.mocked(client.models.Ticket.delete).mockResolvedValue({
      errors: [{ message: "delete failed" }],
    });
    const state: CreatedVisitResourcesState = {
      ...makeVisitState(),
      createdTicketId: "ticket1",
      claimedQueueId: "q1",
      claimedTicketDigits: "001",
      claimedQueuePositionKey: "qp1",
    };
    await cleanupCreatedVisitResources(client, state, "test");

    expect(tryCleanup).toHaveBeenCalledTimes(1);
    expect(client.models.Ticket.delete).toHaveBeenCalledWith({ id: "ticket1" });
    expect(releaseTicketNumber).not.toHaveBeenCalled();
    expect(releaseQueuePosition).not.toHaveBeenCalled();
  });

  it("skips appointment slot and booking reference release when appointment delete fails", async () => {
    const client = makeClient();
    vi.mocked(client.models.Appointment.delete).mockResolvedValue({
      errors: [{ message: "delete failed" }],
    });
    const state: CreatedVisitResourcesState = {
      ...makeVisitState(),
      createdAppointmentId: "apt1",
      claimedAppointmentSlot: {
        departmentName: "Homelessness",
        dateIso: "2026-06-15",
        time: "09:00",
      },
      claimedBookingReferenceNumber: "APT-ABC234",
    };
    await cleanupCreatedVisitResources(client, state, "test");

    expect(tryCleanup).toHaveBeenCalledTimes(1);
    expect(tryCleanup).toHaveBeenCalledWith(
      expect.stringContaining("cleanup Appointment.delete failed"),
      expect.any(Function),
    );
    expect(client.models.Appointment.delete).toHaveBeenCalledWith({ id: "apt1" });
    expect(releaseAppointmentSlot).not.toHaveBeenCalled();
    expect(releaseBookingReferenceNumber).not.toHaveBeenCalled();
  });
});
