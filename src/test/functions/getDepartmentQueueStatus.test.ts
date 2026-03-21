import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockGetQueuePositionCount } = vi.hoisted(() => ({
  mockGetQueuePositionCount: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/enquiriesStateTable", () => ({
  getDate: () => "20260615",
  getQueuePositionCount: mockGetQueuePositionCount,
}));

import { handler as _handler } from "../../../amplify/functions/getDepartmentQueueStatus/handler";

type QueueStatusEvent = {
  arguments: {
    departmentName: string;
  };
};

type QueueStatusResult = {
  queueCount: number;
  updatedAtIso: string;
};

const handler = _handler as (event: QueueStatusEvent) => Promise<QueueStatusResult>;

function makeEvent(departmentName: string): QueueStatusEvent {
  return { arguments: { departmentName } };
}

describe("getDepartmentQueueStatus handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetQueuePositionCount.mockResolvedValue(5);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -- Validation --

  it("throws for invalid department name", async () => {
    await expect(handler(makeEvent("Invalid"))).rejects.toThrow(
      "A valid departmentName is required",
    );
  });

  // -- Successful query --

  it("returns queue count for valid department", async () => {
    const result = await handler(makeEvent("Homelessness"));
    expect(result?.queueCount).toBe(5);
    expect(mockGetQueuePositionCount).toHaveBeenCalledWith("20260615#Homelessness");
  });

  it("returns current ISO timestamp", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));

    const result = await handler(makeEvent("Homelessness"));
    expect(result?.updatedAtIso).toBe("2026-06-15T12:00:00.000Z");
  });

  it("rethrows queue lookup errors", async () => {
    mockGetQueuePositionCount.mockRejectedValue(new Error("ddb down"));

    await expect(handler(makeEvent("Homelessness"))).rejects.toThrow("ddb down");
  });
});
