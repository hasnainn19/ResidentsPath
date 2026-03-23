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

import { handler } from "../../../amplify/functions/adjustQueuePosition/handler";

const makeEvent = (ticketId?: string, newPosition?: number) =>
  ({ arguments: { ticketId, newPosition } }) as any;

const waitingTicket = (id: string, position: number) => ({
  id,
  position,
  departmentName: "dept1",
  status: "WAITING",
});

describe("adjustQueuePosition handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecalculate.mockResolvedValue(true);
    mockTicketUpdate.mockResolvedValue({ data: {} });
  });

  // --- Input validation ---

  it("throws when ticketId is missing", async () => {
    await expect(
      handler(makeEvent(undefined, 1), {} as any, {} as any),
    ).rejects.toThrow("ticketId and newPosition are required");
  });

  it("throws when newPosition is missing", async () => {
    await expect(
      handler(makeEvent("t1", undefined), {} as any, {} as any),
    ).rejects.toThrow("ticketId and newPosition are required");
  });

  // --- Ticket lookup ---

  it("throws when ticket is not found", async () => {
    mockTicketGet.mockResolvedValue({ data: null });

    await expect(
      handler(makeEvent("t1", 1), {} as any, {} as any),
    ).rejects.toThrow("Ticket t1 not found");
  });

  it("throws when ticket is not in WAITING status", async () => {
    mockTicketGet.mockResolvedValue({
      data: { id: "t1", departmentName: "dept1", status: "COMPLETED" },
    });

    await expect(
      handler(makeEvent("t1", 1), {} as any, {} as any),
    ).rejects.toThrow("Ticket t1 is not in WAITING status");
  });

  // --- Empty queue ---

  it("throws when no waiting tickets are found for the department today", async () => {
    mockTicketGet.mockResolvedValue({
      data: { id: "t1", departmentName: "dept1", status: "WAITING" },
    });
    mockTicketList.mockResolvedValue({ data: [] });

    await expect(
      handler(makeEvent("t1", 1), {} as any, {} as any),
    ).rejects.toThrow("No waiting tickets found for department dept1 today");
  });

  // --- Happy path ---

  it("moves the ticket to the requested position and updates all tickets", async () => {
    const ticket = waitingTicket("t1", 3);
    mockTicketGet.mockResolvedValue({ data: ticket });
    mockTicketList.mockResolvedValue({
      data: [
        waitingTicket("t2", 1),
        waitingTicket("t3", 2),
        ticket,
        waitingTicket("t4", 4),
      ],
    });

    await handler(makeEvent("t1", 1), {} as any, {} as any);

    // t1 moves to front; others shift right
    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t1", position: 1 });
    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t2", position: 2 });
    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t3", position: 3 });
    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t4", position: 4 });
  });

  it("returns true on success", async () => {
    const ticket = waitingTicket("t1", 1);
    mockTicketGet.mockResolvedValue({ data: ticket });
    mockTicketList.mockResolvedValue({ data: [ticket] });

    const result = await handler(makeEvent("t1", 1), {} as any, {} as any);

    expect(result).toBe(true);
  });

  it("calls recalculateDepartmentQueue with the ticket's department", async () => {
    const ticket = waitingTicket("t1", 1);
    mockTicketGet.mockResolvedValue({ data: ticket });
    mockTicketList.mockResolvedValue({ data: [ticket] });

    await handler(makeEvent("t1", 1), {} as any, {} as any);

    expect(mockRecalculate).toHaveBeenCalledWith("dept1");
  });

  // --- Position clamping ---

  it("clamps newPosition below 1 to 1", async () => {
    const ticket = waitingTicket("t1", 2);
    mockTicketGet.mockResolvedValue({ data: ticket });
    mockTicketList.mockResolvedValue({
      data: [waitingTicket("t2", 1), ticket],
    });

    await handler(makeEvent("t1", -5), {} as any, {} as any);

    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t1", position: 1 });
    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t2", position: 2 });
  });

  it("clamps newPosition above queue length to the last position", async () => {
    const ticket = waitingTicket("t1", 1);
    mockTicketGet.mockResolvedValue({ data: ticket });
    mockTicketList.mockResolvedValue({
      data: [ticket, waitingTicket("t2", 2)],
    });

    await handler(makeEvent("t1", 999), {} as any, {} as any);

    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t2", position: 1 });
    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "t1", position: 2 });
  });

  // --- Null fallbacks  ---

  it("handles allTickets being null by treating it as an empty list (throws no waiting tickets)", async () => {
    mockTicketGet.mockResolvedValue({
      data: { id: "t1", departmentName: "dept1", status: "WAITING" },
    });
    mockTicketList.mockResolvedValue({ data: null });

    await expect(
      handler(makeEvent("t1", 1), {} as any, {} as any),
    ).rejects.toThrow("No waiting tickets found for department dept1 today");
  });

  it("sorts correctly when tickets have null positions", async () => {
    const ticket = {
      id: "t1",
      position: null,
      departmentName: "dept1",
      status: "WAITING",
    };
    mockTicketGet.mockResolvedValue({ data: ticket });
    mockTicketList.mockResolvedValue({
      data: [
        {
          id: "t2",
          position: null,
          departmentName: "dept1",
          status: "WAITING",
        },
        ticket,
      ],
    });

    const result = await handler(makeEvent("t1", 1), {} as any, {} as any);

    expect(result).toBe(true);
  });

  // --- Error handling ---

  it("throws an error when ticket position updates fail", async () => {
    const ticket = waitingTicket("t1", 1);
    mockTicketGet.mockResolvedValue({ data: ticket });
    mockTicketList.mockResolvedValue({ data: [ticket] });
    mockTicketUpdate.mockRejectedValue(new Error("DynamoDB error"));

    await expect(
      handler(makeEvent("t1", 1), {} as any, {} as any),
    ).rejects.toThrow("Failed to adjust positions for dept1");
  });

  it("throws an error when recalculateDepartmentQueue fails", async () => {
    const ticket = waitingTicket("t1", 1);
    mockTicketGet.mockResolvedValue({ data: ticket });
    mockTicketList.mockResolvedValue({ data: [ticket] });
    mockRecalculate.mockRejectedValue(new Error("recalc error"));

    await expect(
      handler(makeEvent("t1", 1), {} as any, {} as any),
    ).rejects.toThrow(
      "recalculateDepartmentQueue: failed for department dept1",
    );
  });
});
