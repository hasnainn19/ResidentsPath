import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockRecalculate, mockUnmarshall } = vi.hoisted(() => ({
  mockRecalculate: vi.fn(),
  mockUnmarshall: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/recalculateDepartmentQueue", () => ({
  recalculateDepartmentQueue: mockRecalculate,
}));

vi.mock("@aws-sdk/util-dynamodb", () => ({
  unmarshall: mockUnmarshall,
}));

import { handler } from "../../../amplify/functions/onTicketCompleted/handler";

function makeRecord(
  eventName: string,
  newImage?: Record<string, any>,
  oldImage?: Record<string, any>
) {
  return {
    eventName,
    dynamodb: {
      ...(newImage !== undefined && { NewImage: newImage }),
      ...(oldImage !== undefined && { OldImage: oldImage }),
    },
  } as any;
}

function makeEvent(...records: ReturnType<typeof makeRecord>[]) {
  return { Records: records } as any;
}

describe("onTicketCompleted handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecalculate.mockResolvedValue(true);
    mockUnmarshall.mockImplementation((x: any) => x);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("calls recalculateDepartmentQueue when MODIFY changes status from WAITING to COMPLETED", async () => {
    const record = makeRecord(
      "MODIFY",
      { status: "COMPLETED", departmentName: "Homelessness" },
      { status: "WAITING" }
    );

    await handler(makeEvent(record), {} as any, {} as any);

    expect(mockRecalculate).toHaveBeenCalledTimes(1);
    expect(mockRecalculate).toHaveBeenCalledWith("Homelessness");
  });

  it("calls recalculateDepartmentQueue when INSERT creates a WAITING ticket", async () => {
    const record = makeRecord("INSERT", { status: "WAITING", departmentName: "Adults_Duty" });

    await handler(makeEvent(record), {} as any, {} as any);

    expect(mockRecalculate).toHaveBeenCalledTimes(1);
    expect(mockRecalculate).toHaveBeenCalledWith("Adults_Duty");
  });

  it("does not call recalculateDepartmentQueue for INSERT with non-WAITING status", async () => {
    const record = makeRecord("INSERT", { status: "COMPLETED", departmentName: "Homelessness" });

    await handler(makeEvent(record), {} as any, {} as any);

    expect(mockRecalculate).not.toHaveBeenCalled();
  });

  it("does not call recalculateDepartmentQueue for MODIFY that does not reach COMPLETED", async () => {
    const record = makeRecord(
      "MODIFY",
      { status: "WAITING", departmentName: "Homelessness" },
      { status: "WAITING" }
    );

    await handler(makeEvent(record), {} as any, {} as any);

    expect(mockRecalculate).not.toHaveBeenCalled();
  });

  it("does not call recalculateDepartmentQueue for MODIFY when oldImage is missing", async () => {
    const record = makeRecord("MODIFY", { status: "COMPLETED", departmentName: "Homelessness" });

    await handler(makeEvent(record), {} as any, {} as any);

    expect(mockRecalculate).not.toHaveBeenCalled();
  });

  it("does not call recalculateDepartmentQueue when record has no NewImage", async () => {
    const record = makeRecord("MODIFY", undefined, { status: "WAITING" });

    await handler(makeEvent(record), {} as any, {} as any);

    expect(mockRecalculate).not.toHaveBeenCalled();
  });

  it("does not call recalculateDepartmentQueue for unknown event type", async () => {
    const record = makeRecord("UNKNOWN", { status: "WAITING", departmentName: "Homelessness" });

    await handler(makeEvent(record), {} as any, {} as any);

    expect(mockRecalculate).not.toHaveBeenCalled();
  });

  it("deduplicates: calls recalculateDepartmentQueue once when multiple records affect the same department", async () => {
    const records = [
      makeRecord("MODIFY", { status: "COMPLETED", departmentName: "Homelessness" }, { status: "WAITING" }),
      makeRecord("MODIFY", { status: "COMPLETED", departmentName: "Homelessness" }, { status: "WAITING" }),
    ];

    await handler(makeEvent(...records), {} as any, {} as any);

    expect(mockRecalculate).toHaveBeenCalledTimes(1);
    expect(mockRecalculate).toHaveBeenCalledWith("Homelessness");
  });

  it("logs error and skips recalculate when departmentName is missing from record", async () => {
    const record = makeRecord("MODIFY", { status: "COMPLETED" }, { status: "WAITING" });

    await handler(makeEvent(record), {} as any, {} as any);

    expect(console.error).toHaveBeenCalled();
    expect(mockRecalculate).not.toHaveBeenCalled();
  });

  it("catches and logs error when recalculateDepartmentQueue throws, continues for other departments", async () => {
    mockRecalculate
      .mockRejectedValueOnce(new Error("Queue error"))
      .mockResolvedValueOnce(true);

    const records = [
      makeRecord("MODIFY", { status: "COMPLETED", departmentName: "Homelessness" }, { status: "WAITING" }),
      makeRecord("INSERT", { status: "WAITING", departmentName: "Adults_Duty" }),
    ];

    await handler(makeEvent(...records), {} as any, {} as any);

    expect(console.error).toHaveBeenCalled();
    expect(mockRecalculate).toHaveBeenCalledTimes(2);
  });
});
