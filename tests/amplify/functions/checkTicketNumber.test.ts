import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockListTicketByNumber,
} = vi.hoisted(() => ({
  mockListTicketByNumber: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Ticket: {
        listTicketByTicketNumber: mockListTicketByNumber,
      },
    },
  }),
}));

import { handler } from "../../../amplify/functions/checkTicketNumber/handler";

const makeEvent = (args: { ticketNumber?: string }) =>
  ({ arguments: args }) as any;

const makeTicket = (overrides = {}) => ({
  id: "ticket1",
  caseId: "case1",
  status: "WAITING",
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("checkTicketNumber handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------
  // Ticket lookup
  // -------------------
  it("throws when no tickets are returned", async () => {
    mockListTicketByNumber.mockResolvedValue({ data: [] });

    await expect(
      handler(makeEvent({ ticketNumber: "123" }), {} as any, {} as any)
    ).rejects.toThrow("No ticket found with ticket number: 123");
  });

  it("throws when tickets is undefined", async () => {
    mockListTicketByNumber.mockResolvedValue({ data: undefined });

    await expect(
      handler(makeEvent({ ticketNumber: "123" }), {} as any, {} as any)
    ).rejects.toThrow("No ticket found with ticket number: 123");
  });

  // -------------------
  // Filtering logic
  // -------------------
  it("throws when no ticket is WAITING today", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockListTicketByNumber.mockResolvedValue({
      data: [
        makeTicket({
          status: "WAITING",
          createdAt: yesterday.toISOString(),
        }),
      ],
    });

    await expect(
      handler(makeEvent({ ticketNumber: "123" }), {} as any, {} as any)
    ).rejects.toThrow("No ticket found for today with ticket number: 123");
  });

  it("ignores tickets without createdAt", async () => {
    mockListTicketByNumber.mockResolvedValue({
      data: [
        makeTicket({ createdAt: undefined }),
      ],
    });

    await expect(
      handler(makeEvent({ ticketNumber: "123" }), {} as any, {} as any)
    ).rejects.toThrow("No ticket found for today with ticket number: 123");
  });

  it("ignores tickets that are not WAITING", async () => {
    mockListTicketByNumber.mockResolvedValue({
      data: [
        makeTicket({ status: "COMPLETED" }),
      ],
    });

    await expect(
      handler(makeEvent({ ticketNumber: "123" }), {} as any, {} as any)
    ).rejects.toThrow("No ticket found for today with ticket number: 123");
  });

  // -------------------
  // Success cases
  // -------------------
  it("returns caseId for a valid WAITING ticket today", async () => {
    const ticket = makeTicket({ caseId: "case123" });

    mockListTicketByNumber.mockResolvedValue({
      data: [ticket],
    });

    const result = await handler(
      makeEvent({ ticketNumber: "123" }),
      {} as any,
      {} as any
    );

    expect(result).toEqual({
      caseId: "case123",
    });
  });

  it("returns the first valid ticket if multiple exist", async () => {
    const first = makeTicket({ caseId: "first" });
    const second = makeTicket({ caseId: "second" });

    mockListTicketByNumber.mockResolvedValue({
      data: [first, second],
    });

    const result = await handler(
      makeEvent({ ticketNumber: "123" }),
      {} as any,
      {} as any
    );

    expect(result.caseId).toBe("first");
  });
});