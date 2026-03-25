import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockTicketGet, mockTicketUpdate, mockTicketList, mockRecalculate } =
  vi.hoisted(() => ({
    mockTicketGet: vi.fn(),
    mockTicketUpdate: vi.fn(),
    mockTicketList: vi.fn(),
    mockRecalculate: vi.fn(),
  }));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Ticket: {
        get: mockTicketGet,
        update: mockTicketUpdate,
        list: mockTicketList,
      },
    },
  }),
}));

vi.mock("../../../amplify/functions/utils/recalculateDepartmentQueue", () => ({
  recalculateDepartmentQueue: mockRecalculate,
}));

import { handler } from "../../../amplify/functions/markTicketSeen/handler";

const makeEvent = (ticketId?: string) => ({ arguments: { ticketId } }) as any;

describe("markTicketSeen handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecalculate.mockResolvedValue(true);
    mockTicketUpdate.mockResolvedValue({ data: {} });
    mockTicketList.mockResolvedValue({ data: [] });
  });

  it("throws when ticketId is missing", async () => {
    await expect(
      handler(makeEvent(undefined), {} as any, {} as any),
    ).rejects.toThrow("ticketId is required");
  });

  it("throws when ticket is not found", async () => {
    mockTicketGet.mockResolvedValue({ data: null });

    await expect(
      handler(makeEvent("t1"), {} as any, {} as any),
    ).rejects.toThrow("Ticket t1 not found");
  });

  it("throws when ticket has no position", async () => {
    mockTicketGet.mockResolvedValue({
      data: { id: "t1", departmentName: "dept1", position: null },
    });

    await expect(
      handler(makeEvent("t1"), {} as any, {} as any),
    ).rejects.toThrow("Ticket t1 does not have a position assigned");
  });

  it("marks the ticket as COMPLETED with position -1 and a completedAt timestamp", async () => {
    mockTicketGet.mockResolvedValue({
      data: { id: "t1", departmentName: "dept1", position: 2 },
    });

    await handler(makeEvent("t1"), {} as any, {} as any);

    expect(mockTicketUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "t1",
        status: "COMPLETED",
        position: -1,
        completedAt: expect.any(String),
      }),
    );
  });

  it("shifts down waiting tickets that were after the completed position", async () => {
    mockTicketGet.mockResolvedValue({
      data: { id: "t1", departmentName: "dept1", position: 1 },
    });
    mockTicketList.mockResolvedValue({
      data: [
        { id: "t2", position: 2, departmentName: "dept1" },
        { id: "t3", position: 3, departmentName: "dept1" },
      ],
    });

    await handler(makeEvent("t1"), {} as any, {} as any);

    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t2", position: 1 });
    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t3", position: 2 });
  });

  it("does not shift waiting tickets at or before the completed position", async () => {
    mockTicketGet.mockResolvedValue({
      data: { id: "t1", departmentName: "dept1", position: 2 },
    });
    mockTicketList.mockResolvedValue({
      data: [
        { id: "t2", position: 1, departmentName: "dept1" },
        { id: "t3", position: 2, departmentName: "dept1" },
      ],
    });

    await handler(makeEvent("t1"), {} as any, {} as any);

    // Only the completed ticket itself should have been updated
    expect(mockTicketUpdate).toHaveBeenCalledTimes(1);
    expect(mockTicketUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
    );
  });

  it("calls recalculateDepartmentQueue with the ticket's department", async () => {
    mockTicketGet.mockResolvedValue({
      data: { id: "t1", departmentName: "dept1", position: 0 },
    });

    await handler(makeEvent("t1"), {} as any, {} as any);

    expect(mockRecalculate).toHaveBeenCalledWith("dept1");
  });

  it("returns true on success", async () => {
    mockTicketGet.mockResolvedValue({
      data: { id: "t1", departmentName: "dept1", position: 0 },
    });

    const result = await handler(makeEvent("t1"), {} as any, {} as any);

    expect(result).toBe(true);
  });
});
