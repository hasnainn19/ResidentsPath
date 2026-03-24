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

import { handler } from "../../../amplify/functions/flagCaseSafeguarding/handler";

const makeEvent = (caseId?: string, flagged?: boolean) =>
  ({ arguments: { caseId, flagged } }) as any;

describe("flagCaseSafeguarding handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCaseUpdate.mockResolvedValue({ data: {} });
    mockCaseList.mockResolvedValue({ data: [] });
  });

  // -- Flagging Case --

  it("marks a case as a safeguarding issue", async () => {
    const result = await handler(makeEvent("c1", true), {} as any, {} as any);

    expect(mockCaseUpdate).toHaveBeenCalledWith({ id: "c1", flag: true });
    expect(result).toBe(true);
  });

  it("clears a safeguarding flag on a case", async () => {
    const result = await handler(makeEvent("c1", false), {} as any, {} as any);

    expect(mockCaseUpdate).toHaveBeenCalledWith({ id: "c1", flag: false });
    expect(result).toBe(true);
  });

  // -- Error Handling --

  it("returns false when no caseId", async () => {
    mockCaseUpdate.mockRejectedValue(new Error("update failed"));

    await expect(
      handler(makeEvent(undefined, true), {} as any, {} as any),
    ).rejects.toThrow("caseId and flag values are required");
  });

  it("returns false when no flagged value", async () => {
    mockCaseUpdate.mockRejectedValue(new Error("update failed"));

    await expect(
      handler(makeEvent("c1", undefined), {} as any, {} as any),
    ).rejects.toThrow("caseId and flag values are required");
  });

  it("returns false if update couldn't be applied", async () => {
    mockCaseUpdate.mockRejectedValue(new Error("network error"));

    await expect(
      handler(makeEvent("c1", true), {} as any, {} as any),
    ).rejects.toThrow(
      "Could not apply safeguarding flag for case:c1, Error: network error",
    );
  });
});
