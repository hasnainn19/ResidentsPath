import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockCaseGet, mockCaseUpdate, mockCaseList } = vi.hoisted(() => ({
  mockCaseGet: vi.fn(),
  mockCaseUpdate: vi.fn(),
  mockCaseList: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Case: {
        get: mockCaseGet,
        update: mockCaseUpdate,
        list: mockCaseList,
      },
    },
  }),
}));

import { handler } from "../../../amplify/functions/setCasePriority/handler";

const makeEvent = (caseId?: string, priority?: boolean) =>
  ({ arguments: { caseId, priority } }) as any;

describe("setCasePriority handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCaseUpdate.mockResolvedValue({ data: {} });
    mockCaseList.mockResolvedValue({ data: [] });
  });

  // -- Prioritising Case --

  it("marks a case as a priority", async () => {
    const result = await handler(makeEvent("c1", true), {} as any, {} as any);
    expect(mockCaseUpdate).toHaveBeenCalledWith({ id: "c1", priority: true });
    expect(result).toBe(true);
  });

  it("marks a case as non-priority", async () => {
    const result = await handler(makeEvent("c1", false), {} as any, {} as any);
    expect(mockCaseUpdate).toHaveBeenCalledWith({ id: "c1", priority: false });
    expect(result).toBe(true);
  });

  // -- Error Handling --

  it("throws error when no caseId", async () => {
    mockCaseUpdate.mockRejectedValue(new Error("update failed"));

    await expect(
      handler(makeEvent(undefined, true), {} as any, {} as any),
    ).rejects.toThrow("caseId and priority are required");
  });

  it("throws error when no priority value", async () => {
    mockCaseUpdate.mockRejectedValue(new Error("update failed"));

    await expect(
      handler(makeEvent("c1", undefined), {} as any, {} as any),
    ).rejects.toThrow("caseId and priority are required");
  });

  it("throws error if update couldn't be applied", async () => {
    mockCaseUpdate.mockRejectedValue(new Error("network error"));

    await expect(
      handler(makeEvent("c1", true), {} as any, {} as any),
    ).rejects.toThrow(
      "Failed to update the priority level of case:c1 to true, Error: network error",
    );
  });
});
