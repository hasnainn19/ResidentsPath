import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DynamoDBRecord } from "aws-lambda";

const {
  mockReleaseTicketNumber,
  mockReleaseQueuePosition,
  mockReleaseCaseReferenceNumber,
  mockGetDate,
  mockTryCleanup,
} = vi.hoisted(() => ({
  mockReleaseTicketNumber: vi.fn(),
  mockReleaseQueuePosition: vi.fn(),
  mockReleaseCaseReferenceNumber: vi.fn(),
  mockGetDate: vi.fn().mockReturnValue("20260615"),
  mockTryCleanup: vi.fn(),
}));

vi.mock("../../../../amplify/functions/utils/enquiriesStateTable", () => ({
  getDate: (d?: Date) => mockGetDate(d),
  releaseCaseReferenceNumber: mockReleaseCaseReferenceNumber,
  releaseQueuePosition: mockReleaseQueuePosition,
  releaseTicketNumber: mockReleaseTicketNumber,
}));

vi.mock("../../../../amplify/functions/utils/runCleanup", () => ({
  logModelErrors: vi.fn(),
  tryCleanup: mockTryCleanup,
}));

import {
  getRecordImages,
  getRecordTableName,
  getTableNames,
  listAllPages,
  releaseTicketClaims,
  releaseCaseReferenceClaim,
} from "../../../../amplify/functions/cleanupEnquiryState/helpers";

// -- getRecordImages --

describe("getRecordImages", () => {
  it("unmarshalls old and new images", () => {
    const record: Partial<DynamoDBRecord> = {
      dynamodb: {
        OldImage: { id: { S: "old-id" } } as any,
        NewImage: { id: { S: "new-id" } } as any,
      },
    };
    const { oldImage, newImage } = getRecordImages(record as DynamoDBRecord);
    expect(oldImage).toEqual({ id: "old-id" });
    expect(newImage).toEqual({ id: "new-id" });
  });

  it("returns null for missing images", () => {
    const record: Partial<DynamoDBRecord> = { dynamodb: {} };
    const { oldImage, newImage } = getRecordImages(record as DynamoDBRecord);
    expect(oldImage).toBeNull();
    expect(newImage).toBeNull();
  });
});

// -- getRecordTableName --

describe("getRecordTableName", () => {
  it("extracts table name from eventSourceARN", () => {
    const record = {
      eventSourceARN: "arn:aws:dynamodb:eu-west-2:123:table/MyTable/stream/2026-01-01T00:00:00.000",
    } as DynamoDBRecord;
    expect(getRecordTableName(record)).toBe("MyTable");
  });

  it("returns null for missing ARN", () => {
    expect(getRecordTableName({} as DynamoDBRecord)).toBeNull();
  });
});

// -- getTableNames --

describe("getTableNames", () => {
  it("returns table names from env", () => {
    process.env.TICKET_TABLE_NAME = "Tickets";
    process.env.CASE_TABLE_NAME = "Cases";
    process.env.APPOINTMENT_TABLE_NAME = "Appointments";

    expect(getTableNames()).toEqual({
      ticketTableName: "Tickets",
      caseTableName: "Cases",
      appointmentTableName: "Appointments",
    });

    delete process.env.TICKET_TABLE_NAME;
    delete process.env.CASE_TABLE_NAME;
    delete process.env.APPOINTMENT_TABLE_NAME;
  });

  it("throws when env vars are missing", () => {
    delete process.env.TICKET_TABLE_NAME;
    delete process.env.CASE_TABLE_NAME;
    delete process.env.APPOINTMENT_TABLE_NAME;
    expect(() => getTableNames()).toThrow();
  });
});

// -- listAllPages --

describe("listAllPages", () => {
  it("collects items from multiple pages", async () => {
    const listPage = vi
      .fn()
      .mockResolvedValueOnce({ data: ["a", "b"], nextToken: "tok1" })
      .mockResolvedValueOnce({ data: ["c"], nextToken: null });

    const items = await listAllPages(listPage, "test");
    expect(items).toEqual(["a", "b", "c"]);
    expect(listPage).toHaveBeenCalledTimes(2);
  });

  it("returns empty array for no data", async () => {
    const listPage = vi.fn().mockResolvedValueOnce({ data: null, nextToken: null });
    const items = await listAllPages(listPage, "test");
    expect(items).toEqual([]);
  });
});

// -- releaseTicketClaims --

describe("releaseTicketClaims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDate.mockReturnValue("20260615");
    mockTryCleanup.mockImplementation(async (_p: string, fn: () => any) => { await fn(); return true; });
  });

  it("calls tryCleanup twice when shouldReleaseQueuePosition is true", async () => {
    await releaseTicketClaims(
      { ticketNumber: "H001", departmentName: "Homelessness", createdAt: "2026-06-15T10:00:00Z" },
      true,
    );
    expect(mockTryCleanup).toHaveBeenCalledTimes(2);
  });

  it("calls tryCleanup once when shouldReleaseQueuePosition is false", async () => {
    await releaseTicketClaims(
      { ticketNumber: "H001", departmentName: "Homelessness", createdAt: "2026-06-15T10:00:00Z" },
      false,
    );
    expect(mockTryCleanup).toHaveBeenCalledTimes(1);
  });

  it("still calls tryCleanup for both when ticket number is null", async () => {
    await releaseTicketClaims({ ticketNumber: null }, true);
    expect(mockTryCleanup).toHaveBeenCalledTimes(2);
  });

  it("skips ticket release when createdAt is not a valid date", async () => {
    await releaseTicketClaims(
      { ticketNumber: "H001", departmentName: "Homelessness", createdAt: "not-a-date" },
      true,
    );
    expect(mockReleaseTicketNumber).not.toHaveBeenCalled();
  });

  it("skips queue position release when createdAt is not a valid date", async () => {
    await releaseTicketClaims(
      { ticketNumber: "H001", departmentName: "Homelessness", createdAt: "not-a-date" },
      true,
    );
    expect(mockReleaseQueuePosition).not.toHaveBeenCalled();
  });
});

// -- releaseCaseReferenceClaim --

describe("releaseCaseReferenceClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTryCleanup.mockImplementation(async (_p: string, fn: () => any) => { await fn(); return true; });
  });

  it("releases case reference for valid case", async () => {
    const result = await releaseCaseReferenceClaim({ referenceNumber: "ABC-DEF234" });
    expect(result).toBe(true);
    expect(mockReleaseCaseReferenceNumber).toHaveBeenCalledWith("ABC-DEF234");
  });

  it("returns false when referenceNumber is not a string", async () => {
    const result = await releaseCaseReferenceClaim({ referenceNumber: 123 });
    expect(result).toBe(false);
    expect(mockReleaseCaseReferenceNumber).not.toHaveBeenCalled();
  });
});
