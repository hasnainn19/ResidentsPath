import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  mockSend,
  mockDeleteItemCommand,
  mockGetItemCommand,
  mockPutItemCommand,
  mockUpdateItemCommand,
} = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockDeleteItemCommand: vi.fn((input: unknown) => ({ input, _type: "Delete" })),
  mockGetItemCommand: vi.fn((input: unknown) => ({ input, _type: "Get" })),
  mockPutItemCommand: vi.fn((input: unknown) => ({ input, _type: "Put" })),
  mockUpdateItemCommand: vi.fn((input: unknown) => ({ input, _type: "Update" })),
}));
vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: vi.fn(() => ({ send: mockSend })),
  DeleteItemCommand: mockDeleteItemCommand,
  GetItemCommand: mockGetItemCommand,
  PutItemCommand: mockPutItemCommand,
  UpdateItemCommand: mockUpdateItemCommand,
}));

import {
  getEnquiriesStateTableName,
  daysFromNowInSeconds,
  getDate,
  claimCaseReferenceNumber,
  releaseCaseReferenceNumber,
  claimBookingReferenceNumber,
  releaseBookingReferenceNumber,
  claimAppointmentSlot,
  markAppointmentSlotBooked,
  releaseAppointmentSlot,
  claimQueuePosition,
  releaseQueuePosition,
  getQueuePositionCount,
  claimTicketDigits,
  releaseTicketNumber,
} from "../../../../amplify/functions/utils/enquiriesStateTable";

// -- Environment Configuration --

describe("getEnquiriesStateTableName", () => {
  let previousEnquiriesStateTable: string | undefined;

  beforeEach(() => {
    previousEnquiriesStateTable = process.env.ENQUIRIES_STATE_TABLE;
  });

  afterEach(() => {
    if (previousEnquiriesStateTable === undefined) {
      delete process.env.ENQUIRIES_STATE_TABLE;
    } else {
      process.env.ENQUIRIES_STATE_TABLE = previousEnquiriesStateTable;
    }
  });

  it("returns the table name from env", () => {
    process.env.ENQUIRIES_STATE_TABLE = "my-table";
    expect(getEnquiriesStateTableName()).toBe("my-table");
  });

  it("throws when env is not set", () => {
    delete process.env.ENQUIRIES_STATE_TABLE;
    expect(() => getEnquiriesStateTableName()).toThrow("ENQUIRIES_STATE_TABLE is not set");
  });
});

// -- Utility Helpers --

describe("daysFromNowInSeconds", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a value in the future for positive days", () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const result = daysFromNowInSeconds(1);
    expect(result).toBe(nowSeconds + 86400);
  });

  it("returns now for 0 days", () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const result = daysFromNowInSeconds(0);
    expect(result).toBe(nowSeconds);
  });
});

describe("getDate", () => {
  it("returns YYYYMMDD format for a known date", () => {
    const date = new Date("2026-06-15T12:00:00Z");
    const result = getDate(date);
    expect(result).toBe("20260615");
  });

  it("returns current date when no argument is given", () => {
    const result = getDate();
    expect(result).toMatch(/^\d{8}$/);
  });
});

// -- DynamoDB Operations --

describe("DynamoDB operations", () => {
  let previousEnquiriesStateTable: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    mockDeleteItemCommand.mockImplementation((input: unknown) => ({ input, _type: "Delete" }));
    mockGetItemCommand.mockImplementation((input: unknown) => ({ input, _type: "Get" }));
    mockPutItemCommand.mockImplementation((input: unknown) => ({ input, _type: "Put" }));
    mockUpdateItemCommand.mockImplementation((input: unknown) => ({ input, _type: "Update" }));
    previousEnquiriesStateTable = process.env.ENQUIRIES_STATE_TABLE;
    process.env.ENQUIRIES_STATE_TABLE = "test-table";
    mockSend.mockResolvedValue({});
  });

  afterEach(() => {
    if (previousEnquiriesStateTable === undefined) {
      delete process.env.ENQUIRIES_STATE_TABLE;
    } else {
      process.env.ENQUIRIES_STATE_TABLE = previousEnquiriesStateTable;
    }
  });

  // -- Reference Number Claims --

  describe("claimCaseReferenceNumber", () => {
    it("sends PutItemCommand with correct key structure", async () => {
      await claimCaseReferenceNumber("ABC-DEF234");
      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Item.pk.S).toBe("CASE_REFERENCE#ABC-DEF234");
      expect(command.input.Item.sk.S).toBe("CLAIM");
      expect(command.input.ConditionExpression).toContain("attribute_not_exists");
    });
  });

  describe("releaseCaseReferenceNumber", () => {
    it("sends DeleteItemCommand with correct key", async () => {
      await releaseCaseReferenceNumber("ABC-DEF234");
      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key.pk.S).toBe("CASE_REFERENCE#ABC-DEF234");
      expect(command.input.Key.sk.S).toBe("CLAIM");
    });

    it("does nothing when ENQUIRIES_STATE_TABLE is not set", async () => {
      delete process.env.ENQUIRIES_STATE_TABLE;
      await releaseCaseReferenceNumber("ABC-DEF234");
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("claimBookingReferenceNumber", () => {
    it("sends PutItemCommand with BOOKING prefix", async () => {
      await claimBookingReferenceNumber("APT-ABC234");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Item.pk.S).toBe("BOOKING_REFERENCE#APT-ABC234");
    });
  });

  describe("releaseBookingReferenceNumber", () => {
    it("sends DeleteItemCommand with BOOKING prefix", async () => {
      await releaseBookingReferenceNumber("APT-ABC234");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key.pk.S).toBe("BOOKING_REFERENCE#APT-ABC234");
    });
  });

  // -- Appointment Slot Claims --

  describe("claimAppointmentSlot", () => {
    it("sends PutItemCommand with correct partition and sort keys", async () => {
      await claimAppointmentSlot({
        departmentName: "Homelessness",
        dateIso: "2026-06-15",
        time: "09:00",
      });
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Item.pk.S).toBe("APPOINTMENT_SLOT#Homelessness#2026-06-15");
      expect(command.input.Item.sk.S).toBe("TIME#09:00");
      expect(command.input.Item.status.S).toBe("PENDING");
    });
  });

  describe("markAppointmentSlotBooked", () => {
    it("sends UpdateItemCommand to set BOOKED status", async () => {
      await markAppointmentSlotBooked({
        departmentName: "Homelessness",
        dateIso: "2026-06-15",
        time: "09:00",
      });
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key.pk.S).toBe("APPOINTMENT_SLOT#Homelessness#2026-06-15");
      expect(command.input.ExpressionAttributeValues[":booked"].S).toBe("BOOKED");
    });

    it("falls back to a 30-day expiry when the slot date is invalid", async () => {
      const before = daysFromNowInSeconds(30);

      await markAppointmentSlotBooked({
        departmentName: "Homelessness",
        dateIso: "not-a-date",
        time: "09:00",
      });

      const command = mockSend.mock.calls[0][0];
      const expiresAt = Number(command.input.ExpressionAttributeValues[":expiresAt"].N);
      const after = daysFromNowInSeconds(30);

      expect(expiresAt).toBeGreaterThanOrEqual(before);
      expect(expiresAt).toBeLessThanOrEqual(after);
    });
  });

  describe("releaseAppointmentSlot", () => {
    it("sends DeleteItemCommand with correct keys", async () => {
      await releaseAppointmentSlot({
        departmentName: "Homelessness",
        dateIso: "2026-06-15",
        time: "09:00",
      });
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key.pk.S).toBe("APPOINTMENT_SLOT#Homelessness#2026-06-15");
      expect(command.input.Key.sk.S).toBe("TIME#09:00");
    });

    it("does nothing when ENQUIRIES_STATE_TABLE is not set", async () => {
      delete process.env.ENQUIRIES_STATE_TABLE;
      await releaseAppointmentSlot({
        departmentName: "Homelessness",
        dateIso: "2026-06-15",
        time: "09:00",
      });
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  // -- Queue Position Management --

  describe("claimQueuePosition", () => {
    it("returns queue position (activeCount - 1)", async () => {
      mockSend.mockResolvedValue({
        Attributes: { activeCount: { N: "5" } },
      });
      const result = await claimQueuePosition("20260615#Homelessness");
      expect(result).toBe(4);
    });

    it("throws when activeCount is invalid", async () => {
      mockSend.mockResolvedValue({ Attributes: {} });
      await expect(claimQueuePosition("key")).rejects.toThrow(
        "Queue position counter did not return a valid value",
      );
    });
  });

  describe("releaseQueuePosition", () => {
    it("sends UpdateItemCommand to decrement", async () => {
      await releaseQueuePosition("20260615#Homelessness");
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("does nothing when ENQUIRIES_STATE_TABLE is not set", async () => {
      delete process.env.ENQUIRIES_STATE_TABLE;
      await releaseQueuePosition("key");
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("does nothing when the queue position has already been released", async () => {
      const error = new Error("condition check");
      error.name = "ConditionalCheckFailedException";
      mockSend.mockRejectedValue(error);
      await expect(releaseQueuePosition("key")).resolves.toBeUndefined();
    });

    it("rethrows other errors", async () => {
      mockSend.mockRejectedValue(new Error("other error"));
      await expect(releaseQueuePosition("key")).rejects.toThrow("other error");
    });
  });

  describe("getQueuePositionCount", () => {
    it("returns activeCount from DynamoDB", async () => {
      mockSend.mockResolvedValue({
        Item: { activeCount: { N: "10" } },
      });
      const result = await getQueuePositionCount("key");
      expect(result).toBe(10);
    });

    it("returns 0 when item does not exist", async () => {
      mockSend.mockResolvedValue({ Item: undefined });
      const result = await getQueuePositionCount("key");
      expect(result).toBe(0);
    });

    it("throws for invalid activeCount", async () => {
      mockSend.mockResolvedValue({
        Item: { activeCount: { N: "invalid" } },
      });
      await expect(getQueuePositionCount("key")).rejects.toThrow(
        "Queue position counter did not return a valid value",
      );
    });
  });

  // -- Ticket Number Claims --

  describe("claimTicketDigits", () => {
    it("sends PutItemCommand with queue-based key", async () => {
      await claimTicketDigits("20260615#H", "001");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Item.pk.S).toBe("QUEUE#20260615#H");
      expect(command.input.Item.sk.S).toBe("TICKET#001");
    });
  });

  describe("releaseTicketNumber", () => {
    it("sends DeleteItemCommand with correct key", async () => {
      await releaseTicketNumber("20260615#H", "001");
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key.pk.S).toBe("QUEUE#20260615#H");
      expect(command.input.Key.sk.S).toBe("TICKET#001");
    });

    it("does nothing when ENQUIRIES_STATE_TABLE is not set", async () => {
      delete process.env.ENQUIRIES_STATE_TABLE;
      await releaseTicketNumber("queueId", "001");
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});
