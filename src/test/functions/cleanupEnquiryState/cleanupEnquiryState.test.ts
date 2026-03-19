import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DynamoDBStreamEvent } from "aws-lambda";

const {
  mockReleaseAppointmentSlot,
  mockCaseGet,
  mockAppointmentList,
  mockAppointmentDelete,
  mockTicketList,
  mockTicketDelete,
  mockReleaseTicketClaims,
  mockReleaseCaseReferenceClaim,
  mockGetRecordImages,
  mockGetRecordTableName,
  mockGetTableNames,
  mockListAllPages,
  mockTryCleanup,
  mockRunCleanup,
  mockGetAmplifyClient,
} = vi.hoisted(() => ({
  mockReleaseAppointmentSlot: vi.fn(),
  mockCaseGet: vi.fn(),
  mockAppointmentList: vi.fn(),
  mockAppointmentDelete: vi.fn(),
  mockTicketList: vi.fn(),
  mockTicketDelete: vi.fn(),
  mockReleaseTicketClaims: vi.fn(),
  mockReleaseCaseReferenceClaim: vi.fn(),
  mockGetRecordImages: vi.fn(),
  mockGetRecordTableName: vi.fn(),
  mockGetTableNames: vi.fn(),
  mockListAllPages: vi.fn(),
  mockTryCleanup: vi.fn(),
  mockRunCleanup: vi.fn(),
  mockGetAmplifyClient: vi.fn(),
}));

vi.mock("../../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: mockGetAmplifyClient,
}));

vi.mock("../../../../amplify/functions/utils/enquiriesStateTable", () => ({
  releaseAppointmentSlot: mockReleaseAppointmentSlot,
}));

vi.mock("../../../../amplify/functions/cleanupEnquiryState/helpers", () => ({
  getRecordImages: mockGetRecordImages,
  getRecordTableName: mockGetRecordTableName,
  getTableNames: mockGetTableNames,
  listAllPages: mockListAllPages,
  releaseTicketClaims: mockReleaseTicketClaims,
  releaseCaseReferenceClaim: mockReleaseCaseReferenceClaim,
}));

vi.mock("../../../../amplify/functions/utils/runCleanup", () => ({
  logModelErrors: vi.fn(),
  runCleanup: mockRunCleanup,
  tryCleanup: mockTryCleanup,
}));

import { handler as _handler } from "../../../../amplify/functions/cleanupEnquiryState/handler";

const handler = _handler as (event: any) => Promise<any>;

function makeRecord(
  tableName: string,
  eventName: string,
  oldImage: Record<string, unknown> | null,
  newImage: Record<string, unknown> | null,
) {
  return {
    eventName,
    eventSourceARN: `arn:aws:dynamodb:eu-west-2:123:table/${tableName}/stream/2026`,
    dynamodb: {
      OldImage: oldImage,
      NewImage: newImage,
    },
  };
}

function makeEvent(records: ReturnType<typeof makeRecord>[]): DynamoDBStreamEvent {
  return { Records: records } as any;
}

describe("cleanupEnquiryState handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetAmplifyClient.mockResolvedValue({
      models: {
        Case: { get: mockCaseGet },
        Appointment: { list: mockAppointmentList, delete: mockAppointmentDelete },
        Ticket: { list: mockTicketList, delete: mockTicketDelete },
      },
    });
    mockGetRecordImages.mockImplementation((record: any) => {
      const old = record.dynamodb?.OldImage;
      const newImg = record.dynamodb?.NewImage;
      return { oldImage: old ?? null, newImage: newImg ?? null };
    });
    mockGetRecordTableName.mockImplementation((record: any) => {
      const match = record.eventSourceARN?.match(/:table\/([^/]+)/);
      return match?.[1] ?? null;
    });
    mockGetTableNames.mockReturnValue({
      ticketTableName: "Tickets",
      caseTableName: "Cases",
      appointmentTableName: "Appointments",
    });
    mockCaseGet.mockResolvedValue({ data: null, errors: undefined });
    mockAppointmentDelete.mockResolvedValue({ errors: undefined });
    mockTicketDelete.mockResolvedValue({ errors: undefined });
    mockReleaseTicketClaims.mockResolvedValue(undefined);
    mockReleaseCaseReferenceClaim.mockResolvedValue(undefined);
    mockReleaseAppointmentSlot.mockResolvedValue(undefined);
    mockListAllPages.mockResolvedValue([]);
    mockRunCleanup.mockImplementation(async (_p: string, _m: string, fn: () => any) => fn());
    mockTryCleanup.mockImplementation(async (_p: string, fn: () => any) => {
      try {
        await fn();
        return true;
      } catch {
        return false;
      }
    });

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -- Ticket Records --

  describe("ticket records", () => {
    it("releases ticket claims on MODIFY WAITING->COMPLETED", async () => {
      const event = makeEvent([
        makeRecord(
          "Tickets",
          "MODIFY",
          { status: "WAITING", ticketNumber: "H001" },
          { status: "COMPLETED", ticketNumber: "H001", departmentName: "Homelessness" },
        ),
      ]);

      await handler(event);
      expect(mockReleaseTicketClaims).toHaveBeenCalledWith(
        expect.objectContaining({ status: "COMPLETED" }),
        true,
      );
    });

    it("does not release on MODIFY that is not WAITING->COMPLETED", async () => {
      const event = makeEvent([
        makeRecord("Tickets", "MODIFY", { status: "WAITING" }, { status: "WAITING" }),
      ]);

      await handler(event);
      expect(mockReleaseTicketClaims).not.toHaveBeenCalled();
    });

    it("releases ticket claims on REMOVE", async () => {
      const event = makeEvent([
        makeRecord(
          "Tickets",
          "REMOVE",
          { status: "WAITING", ticketNumber: "H001", departmentName: "Homelessness" },
          null,
        ),
      ]);

      await handler(event);
      expect(mockReleaseTicketClaims).toHaveBeenCalledWith(
        expect.objectContaining({ status: "WAITING" }),
        true,
      );
    });
  });

  // -- Case Records --

  describe("case records", () => {
    it("releases case reference and deletes related items on REMOVE", async () => {
      const event = makeEvent([
        makeRecord(
          "Cases",
          "REMOVE",
          { id: "case1", referenceNumber: "ABC-DEF234", departmentName: "Homelessness" },
          null,
        ),
      ]);

      await handler(event);
      expect(mockReleaseCaseReferenceClaim).toHaveBeenCalled();
    });

    it("deletes related tickets and appointments on case REMOVE", async () => {
      mockListAllPages
        .mockResolvedValueOnce([{ id: "apt1", date: "2026-06-15", time: "09:00" }])
        .mockResolvedValueOnce([{ id: "tkt1", ticketNumber: "H001" }]);

      mockAppointmentDelete.mockResolvedValue({ errors: undefined });
      mockTicketDelete.mockResolvedValue({ errors: undefined });

      const event = makeEvent([
        makeRecord(
          "Cases",
          "REMOVE",
          { id: "case1", referenceNumber: "ABC-DEF234", departmentName: "Homelessness" },
          null,
        ),
      ]);

      await handler(event);
      expect(mockReleaseCaseReferenceClaim).toHaveBeenCalled();
      expect(mockAppointmentDelete).toHaveBeenCalledWith({ id: "apt1" });
      expect(mockTicketDelete).toHaveBeenCalledWith({ id: "tkt1" });
      expect(mockReleaseAppointmentSlot).toHaveBeenCalled();
    });

    it("skips appointment slot release when appointment delete fails", async () => {
      mockListAllPages
        .mockResolvedValueOnce([{ id: "apt1", date: "2026-06-15", time: "09:00" }])
        .mockResolvedValueOnce([]);
      mockAppointmentDelete.mockRejectedValueOnce(new Error("delete failed"));

      const event = makeEvent([
        makeRecord(
          "Cases",
          "REMOVE",
          { id: "case1", referenceNumber: "ABC-DEF234", departmentName: "Homelessness" },
          null,
        ),
      ]);

      await handler(event);
      expect(mockAppointmentDelete).toHaveBeenCalledWith({ id: "apt1" });
      expect(mockReleaseAppointmentSlot).not.toHaveBeenCalled();
    });

    it("does not process INSERT case records", async () => {
      const event = makeEvent([
        makeRecord("Cases", "INSERT", null, { id: "case1", referenceNumber: "ABC-DEF234" }),
      ]);

      await handler(event);
      expect(mockReleaseCaseReferenceClaim).not.toHaveBeenCalled();
    });
  });

  // -- Appointment Records --

  describe("appointment records", () => {
    it("releases slot on MODIFY when status changes to CANCELLED", async () => {
      mockCaseGet.mockResolvedValue({
        data: { departmentName: "Homelessness" },
        errors: undefined,
      });

      const event = makeEvent([
        makeRecord(
          "Appointments",
          "MODIFY",
          { status: "SCHEDULED", caseId: "c1", date: "2026-06-15", time: "09:00" },
          { status: "CANCELLED", caseId: "c1", date: "2026-06-15", time: "09:00" },
        ),
      ]);

      await handler(event);
      expect(mockReleaseAppointmentSlot).toHaveBeenCalled();
    });

    it("releases slot on REMOVE", async () => {
      mockCaseGet.mockResolvedValue({
        data: { departmentName: "Homelessness" },
        errors: undefined,
      });

      const event = makeEvent([
        makeRecord(
          "Appointments",
          "REMOVE",
          { status: "SCHEDULED", caseId: "c1", date: "2026-06-15", time: "09:00" },
          null,
        ),
      ]);

      await handler(event);
      expect(mockReleaseAppointmentSlot).toHaveBeenCalled();
    });

    it("skips slot release when appointment has missing fields", async () => {
      const event = makeEvent([
        makeRecord("Appointments", "REMOVE", { status: "SCHEDULED", caseId: "c1" }, null),
      ]);
      await handler(event);
      expect(mockReleaseAppointmentSlot).not.toHaveBeenCalled();
      expect(mockCaseGet).not.toHaveBeenCalled();
    });

    it("skips slot release when case has no department", async () => {
      mockCaseGet.mockResolvedValue({ data: { departmentName: null }, errors: undefined });
      const event = makeEvent([
        makeRecord(
          "Appointments",
          "REMOVE",
          { status: "SCHEDULED", caseId: "c1", date: "2026-06-15", time: "09:00" },
          null,
        ),
      ]);
      await handler(event);
      expect(mockReleaseAppointmentSlot).not.toHaveBeenCalled();
    });
  });
});
