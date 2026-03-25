import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockTicketList, mockStaffList, mockCaseList } = vi.hoisted(() => ({
  mockTicketList: vi.fn(),
  mockStaffList: vi.fn(),
  mockCaseList: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Ticket: { list: mockTicketList },
      Staff: { list: mockStaffList },
      Case: { list: mockCaseList },
    },
  }),
}));

import { handler } from "../../../amplify/functions/getDashboardStats/handler";

const makeEvent = () => ({ arguments: {} }) as any;

const makeTicket = (id: string, caseId: string, steppedOut?: boolean) => ({
  id,
  caseId,
  steppedOut: steppedOut ?? null,
  status: "WAITING",
});

const makeStaff = (id: string) => ({ id });

const makeCase = (id: string) => ({ id, status: "OPEN", priority: true });

describe("getDashboardStats handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Returns correct counts ──────────────────────────────────────────────────

  it("returns zero counts when all lists are empty", async () => {
    mockTicketList.mockResolvedValue({ data: [] });
    mockStaffList.mockResolvedValue({ data: [] });
    mockCaseList.mockResolvedValue({ data: [] });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result).toEqual({
      waitingCount: 0,
      steppedOutCount: 0,
      staffCount: 0,
      priorityCount: 0,
    });
  });

  it("returns the total number of waiting tickets as waitingCount", async () => {
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket("t1", "c1"),
        makeTicket("t2", "c2"),
        makeTicket("t3", "c3"),
      ],
    });
    mockStaffList.mockResolvedValue({ data: [] });
    mockCaseList.mockResolvedValue({ data: [] });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result?.waitingCount).toBe(3);
  });

  it("returns the number of available staff as staffCount", async () => {
    mockTicketList.mockResolvedValue({ data: [] });
    mockStaffList.mockResolvedValue({
      data: [makeStaff("s1"), makeStaff("s2")],
    });
    mockCaseList.mockResolvedValue({ data: [] });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result?.staffCount).toBe(2);
  });

  // ── steppedOutCount ─────────────────────────────────────────────────────────

  it("counts only tickets where steppedOut is exactly true", async () => {
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket("t1", "c1", true),
        makeTicket("t2", "c2", true),
        makeTicket("t3", "c3", false),
        makeTicket("t4", "c4"), // null
      ],
    });
    mockStaffList.mockResolvedValue({ data: [] });
    mockCaseList.mockResolvedValue({ data: [] });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result?.steppedOutCount).toBe(2);
  });

  it("returns 0 steppedOutCount when no tickets have steppedOut true", async () => {
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "c1", false), makeTicket("t2", "c2")],
    });
    mockStaffList.mockResolvedValue({ data: [] });
    mockCaseList.mockResolvedValue({ data: [] });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result?.steppedOutCount).toBe(0);
  });

  // ── priorityCount ───────────────────────────────────────────────────────────

  it("counts waiting tickets whose caseId matches a priority case", async () => {
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket("t1", "case-A"),
        makeTicket("t2", "case-B"),
        makeTicket("t3", "case-C"),
      ],
    });
    mockStaffList.mockResolvedValue({ data: [] });
    mockCaseList.mockResolvedValue({
      data: [makeCase("case-A"), makeCase("case-C")],
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result?.priorityCount).toBe(2);
  });

  it("returns 0 priorityCount when there are no priority cases", async () => {
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-A"), makeTicket("t2", "case-B")],
    });
    mockStaffList.mockResolvedValue({ data: [] });
    mockCaseList.mockResolvedValue({ data: [] });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result?.priorityCount).toBe(0);
  });

  it("returns 0 priorityCount when no waiting ticket caseIds match any priority case", async () => {
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-X"), makeTicket("t2", "case-Y")],
    });
    mockStaffList.mockResolvedValue({ data: [] });
    mockCaseList.mockResolvedValue({
      data: [makeCase("case-A"), makeCase("case-B")],
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result?.priorityCount).toBe(0);
  });

  // ── All counts together ─────────────────────────────────────────────────────

  it("returns all four counts correctly in a combined scenario", async () => {
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket("t1", "case-A", true), // stepped out, priority case
        makeTicket("t2", "case-B", true), // stepped out, not priority
        makeTicket("t3", "case-C", false), // not stepped out, priority case
        makeTicket("t4", "case-D"), // not stepped out, not priority
      ],
    });
    mockStaffList.mockResolvedValue({
      data: [makeStaff("s1"), makeStaff("s2"), makeStaff("s3")],
    });
    mockCaseList.mockResolvedValue({
      data: [makeCase("case-A"), makeCase("case-C")],
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result).toEqual({
      waitingCount: 4,
      steppedOutCount: 2,
      staffCount: 3,
      priorityCount: 2,
    });
  });
});
