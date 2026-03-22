import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockTicketGet, mockTicketUpdate } =
  vi.hoisted(() => ({
    mockTicketGet: vi.fn(),
    mockTicketUpdate: vi.fn(),
  }));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Ticket: {
        get: mockTicketGet,
        update: mockTicketUpdate,
      },
    },
  }),
}));

import { handler } from "../../../amplify/functions/handleSteppedOut/handler";

const makeEvent = (args: {
  ticketId?: string;
  caseId?: string;
  steppedOut: boolean;
}) => ({ arguments: args }) as any;

const makeTicket = (overrides = {}) => ({
  id: "ticket1",
  caseId: "case1",
  ...overrides,
});

describe("handleSteppedOut handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTicketUpdate.mockResolvedValue({ data: makeTicket() });
  });

  describe("input validation", () => {
    it("throws when ticketId is missing", async () => {
      await expect(
        handler(makeEvent({ caseId: "case1", steppedOut: true }), {} as any, {} as any),
      ).rejects.toThrow("handleSteppedOut: Missing ticketId");
    });

    it("throws when caseId is missing", async () => {
      await expect(
        handler(makeEvent({ ticketId: "ticket1", steppedOut: true }), {} as any, {} as any),
      ).rejects.toThrow("handleSteppedOut: Missing caseId");
    });
  });

  describe("ticket lookup", () => {
    it("throws when ticket is not found", async () => {
      mockTicketGet.mockResolvedValue({ data: null });

      await expect(
        handler(makeEvent({ ticketId: "ticket1", caseId: "case1", steppedOut: true }), {} as any, {} as any),
      ).rejects.toThrow("handleSteppedOut: Ticket with ID ticket1 not found");
    });

    it("throws when the ticket does not belong to the given case", async () => {
      mockTicketGet.mockResolvedValue({ data: makeTicket({ caseId: "other-case" }) });

      await expect(
        handler(makeEvent({ ticketId: "ticket1", caseId: "case1", steppedOut: true }), {} as any, {} as any),
      ).rejects.toThrow("handleSteppedOut: Not authorized to modify this ticket");
    });
  });

  it("throws when Ticket.update returns no data", async () => {
    mockTicketGet.mockResolvedValue({ data: makeTicket() });
    mockTicketUpdate.mockResolvedValue({ data: null });

    await expect(
      handler(makeEvent({ ticketId: "ticket1", caseId: "case1", steppedOut: true }), {} as any, {} as any),
    ).rejects.toThrow("handleSteppedOut: Failed to update ticket ticket1");
  });

  it("passes steppedOut: true through to Ticket.update", async () => {
    mockTicketGet.mockResolvedValue({ data: makeTicket() });

    await handler(makeEvent({ ticketId: "ticket1", caseId: "case1", steppedOut: true }), {} as any, {} as any);

    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "ticket1", steppedOut: true });
  });

  it("passes steppedOut: false through to Ticket.update", async () => {
    mockTicketGet.mockResolvedValue({ data: makeTicket() });

    await handler(makeEvent({ ticketId: "ticket1", caseId: "case1", steppedOut: false }), {} as any, {} as any);

    expect(mockTicketUpdate).toHaveBeenCalledWith({ id: "ticket1", steppedOut: false });
  });

  it("returns { success: true } on success", async () => {
    mockTicketGet.mockResolvedValue({ data: makeTicket() });

    const result = await handler(
      makeEvent({ ticketId: "ticket1", caseId: "case1", steppedOut: true }),
      {} as any, {} as any,
    );

    expect(result).toEqual({ success: true });
  });
});
