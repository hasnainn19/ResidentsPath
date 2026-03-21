import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockDdbSend, mockQueryCommandConstructor } = vi.hoisted(() => ({
  mockDdbSend: vi.fn(),
  mockQueryCommandConstructor: vi.fn(function (this: any, input: any) {
    this.input = input;
  }),
}));

vi.mock("@aws-sdk/client-dynamodb", () => {
  return {
    DynamoDBClient: class {
      send = mockDdbSend;
    },
    QueryCommand: mockQueryCommandConstructor,
  };
});

vi.mock("../../../shared/formSchema", () => ({
  DepartmentEnum: {
    safeParse: (val: unknown) => ({
      success: typeof val === "string" && val === "Homelessness",
    }),
  },
  getFutureBookableAppointmentTimes: (dateIso: string) => {
    if (dateIso === "2026-06-15") return ["09:00", "09:30", "10:00", "10:30", "11:00"];
    return [];
  },
  isBookableAppointmentTime: (time: string) => /^\d{2}:\d{2}$/.test(time),
  isValidIsoDate: (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d),
}));

import { handler as _handler } from "../../../amplify/functions/getAvailableAppointmentTimes/handler";

const handler = _handler as (event: any) => Promise<any>;

function makeEvent(departmentName: string, dateIso: string) {
  return { arguments: { departmentName, dateIso } } as any;
}

describe("getAvailableAppointmentTimes handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ENQUIRIES_STATE_TABLE = "test-table";
  });

  afterEach(() => {
    delete process.env.ENQUIRIES_STATE_TABLE;
  });

  // -- Input Validation --

  it("returns empty array for invalid department", async () => {
    const result = await handler(makeEvent("Invalid", "2026-06-15"));
    expect(result?.availableTimes).toEqual([]);
  });

  it("returns empty array for invalid date", async () => {
    const result = await handler(makeEvent("Homelessness", "invalid"));
    expect(result?.availableTimes).toEqual([]);
  });

  it("returns empty array when no future times available", async () => {
    const result = await handler(makeEvent("Homelessness", "2026-01-01"));
    expect(result?.availableTimes).toEqual([]);
  });

  // -- Available Times --

  it("returns all times when none are claimed", async () => {
    mockDdbSend.mockResolvedValue({ Items: [] });
    const result = await handler(makeEvent("Homelessness", "2026-06-15"));
    expect(result?.availableTimes).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });

  it("queries DynamoDB using the expected table and appointment slot partition key", async () => {
    mockDdbSend.mockResolvedValue({ Items: [] });

    await handler(makeEvent("Homelessness", "2026-06-15"));

    expect(mockQueryCommandConstructor).toHaveBeenCalledWith({
      TableName: "test-table",
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: "APPOINTMENT_SLOT#Homelessness#2026-06-15" },
      },
      ConsistentRead: true,
      ProjectionExpression: "sk, #status, expiresAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
    });
    expect(mockDdbSend).toHaveBeenCalledTimes(1);
  });

  it("returns all times when the query returns no items field", async () => {
    mockDdbSend.mockResolvedValue({});
    const result = await handler(makeEvent("Homelessness", "2026-06-15"));
    expect(result?.availableTimes).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });

  // -- Claimed Time Filtering --

  it("filters out claimed times", async () => {
    mockDdbSend.mockResolvedValue({
      Items: [
        {
          sk: { S: "TIME#09:00" },
          status: { S: "BOOKED" },
          expiresAt: { N: String(Math.floor(Date.now() / 1000) + 3600) },
        },
        {
          sk: { S: "TIME#10:00" },
          status: { S: "PENDING" },
          expiresAt: { N: String(Math.floor(Date.now() / 1000) + 3600) },
        },
      ],
    });

    const result = await handler(makeEvent("Homelessness", "2026-06-15"));
    expect(result?.availableTimes).toEqual(["09:30", "10:30", "11:00"]);
  });

  it("does not filter expired claims", async () => {
    mockDdbSend.mockResolvedValue({
      Items: [
        {
          sk: { S: "TIME#09:00" },
          status: { S: "PENDING" },
          expiresAt: { N: String(Math.floor(Date.now() / 1000) - 100) },
        },
      ],
    });

    const result = await handler(makeEvent("Homelessness", "2026-06-15"));
    expect(result?.availableTimes).toContain("09:00");
  });

  it("ignores invalid claims but still blocks valid claims without a status", async () => {
    mockDdbSend.mockResolvedValue({
      Items: [
        {
          sk: { S: "NOT_A_TIME#09:00" },
          status: { S: "BOOKED" },
          expiresAt: { N: String(Math.floor(Date.now() / 1000) + 3600) },
        },
        {
          sk: { S: "TIME#09:30" },
          status: { S: "CANCELLED" },
          expiresAt: { N: String(Math.floor(Date.now() / 1000) + 3600) },
        },
        {
          sk: { S: "TIME#invalid" },
          status: { S: "BOOKED" },
          expiresAt: { N: String(Math.floor(Date.now() / 1000) + 3600) },
        },
        {
          sk: { S: "TIME#10:00" },
        },
      ],
    });

    const result = await handler(makeEvent("Homelessness", "2026-06-15"));
    expect(result?.availableTimes).toEqual(["09:00", "09:30", "10:30", "11:00"]);
  });

  it("throws when the enquiries state table name is missing", async () => {
    delete process.env.ENQUIRIES_STATE_TABLE;

    await expect(handler(makeEvent("Homelessness", "2026-06-15"))).rejects.toThrow(
      "ENQUIRIES_STATE_TABLE is not set",
    );
  });

  it("propagates DynamoDB errors", async () => {
    mockDdbSend.mockRejectedValue(new Error("DynamoDB unavailable"));

    await expect(handler(makeEvent("Homelessness", "2026-06-15"))).rejects.toThrow(
      "DynamoDB unavailable",
    );
  });
});
