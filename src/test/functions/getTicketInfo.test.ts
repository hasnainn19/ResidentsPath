import { vi, describe, it, expect, beforeEach } from "vitest";

const {
  mockCaseGet,
  mockTicketList,
} = vi.hoisted(() => ({
  mockCaseGet: vi.fn(),
  mockTicketList: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Case: {
        get: mockCaseGet,
      },
      Ticket: {
        list: mockTicketList,
      },
    },
  }),
}));

import { handler } from "../../../amplify/functions/getTicketInfo/handler";

const makeEvent = (args: { caseId?: string }) =>
  ({ arguments: args }) as any;

const makeCase = (overrides = {}) => ({
  id: "case1",
  departmentName: "dept1",
  ...overrides,
});

const makeTicket = (overrides = {}) => ({
  id: "ticket1",
  caseId: "case1",
  status: "WAITING",
  createdAt: new Date().toISOString(),
  position: 1,
  estimatedWaitTimeLower: 5,
  estimatedWaitTimeUpper: 10,
  steppedOut: false,
  notificationsEnabled: true,
  ...overrides,
});

describe("getTicketInfo handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------
  // Input validation
  // -------------------
  it("throws error when caseId is missing", async () => {
    await expect(
      handler(makeEvent({}), {} as any, {} as any)
    ).rejects.toThrow("caseId required");
  });

  // -------------------
  // Case lookup
  // -------------------
  it("throws error when case is not found", async () => {
    mockCaseGet.mockResolvedValue({ data: null });

    await expect(
      handler(makeEvent({ caseId: "case1" }), {} as any, {} as any)
    ).rejects.toThrow("Case case1 not found");
  });

  it("throws when case has no departmentName", async () => {
    mockCaseGet.mockResolvedValue({
      data: makeCase({ departmentName: null }),
    });

    await expect(
      handler(makeEvent({ caseId: "case1" }), {} as any, {} as any)
    ).rejects.toThrow("Case case1 has no departmentName");
  });

  // -------------------
  // Ticket lookup
  // -------------------
  it("throws error when no tickets found", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });
    mockTicketList.mockResolvedValue({ data: [] });

    await expect(
      handler(makeEvent({ caseId: "case1" }), {} as any, {} as any)
    ).rejects.toThrow("Tickets with caseId case1 not found");
  });

  it("throws error when all tickets are null", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });
    mockTicketList.mockResolvedValue({ data: [null, null] });

    await expect(
      handler(makeEvent({ caseId: "case1" }), {} as any, {} as any)
    ).rejects.toThrow("No valid tickets with caseId case1 found");
  });

  it("filters out null tickets and still finds a valid one", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });

    const validTicket = makeTicket();

    mockTicketList.mockResolvedValue({
        data: [null, validTicket, null],
    });

    const result = await handler(
        makeEvent({ caseId: "case1" }),
        {} as any,
        {} as any
    );

    expect(result.ticketId).toBe(validTicket.id);
  });

  it("throws error when no WAITING ticket for today", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockTicketList.mockResolvedValue({
      data: [
        makeTicket({
          status: "WAITING",
          createdAt: yesterday.toISOString(),
        }),
      ],
    });

    await expect(
      handler(makeEvent({ caseId: "case1" }), {} as any, {} as any)
    ).rejects.toThrow("No waiting ticket for today for case case1");
  });

  it("throws error when all tickets are missing createdAt", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });

    mockTicketList.mockResolvedValue({
        data: [
        makeTicket({ createdAt: undefined }),
        makeTicket({ createdAt: null }),
        ],
    });

    await expect(
        handler(makeEvent({ caseId: "case1" }), {} as any, {} as any)
    ).rejects.toThrow("No waiting ticket for today for case case1");
  });

  // -------------------
  // Success case
  // -------------------
  it("returns the current waiting ticket for today", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });

    const ticket = makeTicket({
      position: 3,
      estimatedWaitTimeLower: 10,
      estimatedWaitTimeUpper: 20,
      steppedOut: true,
      notificationsEnabled: false,
    });

    mockTicketList.mockResolvedValue({
      data: [ticket],
    });

    const result = await handler(
      makeEvent({ caseId: "case1" }),
      {} as any,
      {} as any
    );

    expect(result).toEqual({
      ticketId: ticket.id,
      departmentName: "dept1",
      position: 3,
      estimatedWaitTimeLower: 10,
      estimatedWaitTimeUpper: 20,
      steppedOut: true,
      notificationsEnabled: false,
    });
  });

  it("defaults steppedOut and notificationsEnabled to false", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });

    const ticket = makeTicket({
      steppedOut: undefined,
      notificationsEnabled: undefined,
    });

    mockTicketList.mockResolvedValue({
      data: [ticket],
    });

    const result = await handler(
      makeEvent({ caseId: "case1" }),
      {} as any,
      {} as any
    );

    expect(result.steppedOut).toBe(false);
    expect(result.notificationsEnabled).toBe(false);
  });
});