import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockDepartmentList, mockTicketList, mockCaseGet } = vi.hoisted(() => ({
  mockDepartmentList: vi.fn(),
  mockTicketList: vi.fn(),
  mockCaseGet: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Department: { list: mockDepartmentList },
      Ticket: { list: mockTicketList },
      Case: { get: mockCaseGet },
    },
  }),
}));

import { handler as _handler } from "../../../amplify/functions/getQueueItems/handler";
const handler = _handler as (
  event: any,
  context: any,
  callback: any,
) => Promise<any[]>;

// ── Helpers ─────────────────────────────────────────────────────────────────

const makeEvent = (departmentName?: string) =>
  ({ arguments: { departmentName } }) as any;

const makeDept = (id: string, name: string) => ({ id, name });

const makeTicket = (
  id: string,
  caseId: string,
  departmentName: string,
  overrides: Partial<{
    position: number | null;
    ticketNumber: string;
    notes: string | null;
  }> = {},
) => ({
  id,
  caseId,
  departmentName,
  ticketNumber: overrides.ticketNumber ?? `TN-${id}`,
  position: overrides.position !== undefined ? overrides.position : 1,
  notes: overrides.notes !== undefined ? overrides.notes : null,
  status: "WAITING",
});

const makeCase = (
  id: string,
  overrides: Partial<{
    referenceNumber: string;
    enquiry: string | null;
    description: string | null;
    priority: boolean;
    flag: boolean;
  }> = {},
) => ({
  id,
  referenceNumber: overrides.referenceNumber ?? `REF-${id}`,
  enquiry: overrides.enquiry !== undefined ? overrides.enquiry : null,
  description:
    overrides.description !== undefined ? overrides.description : null,
  priority: overrides.priority ?? false,
  flag: overrides.flag ?? false,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("getQueueItems handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Early return ────────────────────────────────────────────────────────────

  it("returns an empty array when there are no waiting tickets", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({ data: [] });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result).toEqual([]);
    expect(mockCaseGet).not.toHaveBeenCalled();
  });

  it("returns an empty array when tickets data is null", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({ data: null });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result).toEqual([]);
    expect(mockCaseGet).not.toHaveBeenCalled();
  });

  // ── departmentName filtering ────────────────────────────────────────────────

  it("does not add departmentName filter when no departmentName is provided", async () => {
    mockDepartmentList.mockResolvedValue({
      data: [makeDept("dept-1", "Housing")],
    });
    mockTicketList.mockResolvedValue({ data: [] });

    await handler(makeEvent(), {} as any, {} as any);

    const calledFilter = mockTicketList.mock.calls[0][0].filter;
    expect(calledFilter).not.toHaveProperty("departmentName");
  });

  it("adds departmentName filter when a matching department is found", async () => {
    mockDepartmentList.mockResolvedValue({
      data: [makeDept("dept-id-1", "Housing")],
    });
    mockTicketList.mockResolvedValue({ data: [] });

    await handler(makeEvent("Housing"), {} as any, {} as any);

    const calledFilter = mockTicketList.mock.calls[0][0].filter;
    expect(calledFilter.departmentName).toEqual({ eq: "dept-id-1" });
  });

  it("does not add departmentName filter when the provided name is not found in departments", async () => {
    mockDepartmentList.mockResolvedValue({
      data: [makeDept("dept-id-1", "Housing")],
    });
    mockTicketList.mockResolvedValue({ data: [] });

    await handler(makeEvent("Unknown Department"), {} as any, {} as any);

    const calledFilter = mockTicketList.mock.calls[0][0].filter;
    expect(calledFilter).not.toHaveProperty("departmentName");
  });

  // ── Department name resolution ──────────────────────────────────────────────

  it("uses the department name from deptMap when the ticket's departmentName matches a dept id", async () => {
    mockDepartmentList.mockResolvedValue({
      data: [makeDept("dept-id-1", "Housing")],
    });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-id-1")],
    });
    mockCaseGet.mockResolvedValue({ data: makeCase("case-1") });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].department).toBe("Housing");
  });

  it("falls back to ticket.departmentName when the dept id is not in deptMap", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "unknown-dept-id")],
    });
    mockCaseGet.mockResolvedValue({ data: makeCase("case-1") });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].department).toBe("unknown-dept-id");
  });

  // ── Case record joining ─────────────────────────────────────────────────────

  it("uses caseRecord.referenceNumber as title when the case is found", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1")],
    });
    mockCaseGet.mockResolvedValue({
      data: makeCase("case-1", { referenceNumber: "REF-0001" }),
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].title).toBe("REF-0001");
  });

  it("falls back to ticket.ticketNumber as title when the case is not found", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1", { ticketNumber: "TKT-99" })],
    });
    mockCaseGet.mockResolvedValue({ data: null });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].title).toBe("TKT-99");
  });

  // ── Description composition ─────────────────────────────────────────────────

  it("joins enquiry and description with ' — ' when both are present", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1")],
    });
    mockCaseGet.mockResolvedValue({
      data: makeCase("case-1", {
        enquiry: "Housing issue",
        description: "Needs urgent help",
      }),
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].description).toBe("Housing issue — Needs urgent help");
  });

  it("uses only enquiry when description is absent", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1")],
    });
    mockCaseGet.mockResolvedValue({
      data: makeCase("case-1", { enquiry: "Housing issue", description: null }),
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].description).toBe("Housing issue");
  });

  it("uses only description when enquiry is absent", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1")],
    });
    mockCaseGet.mockResolvedValue({
      data: makeCase("case-1", {
        enquiry: null,
        description: "Needs urgent help",
      }),
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].description).toBe("Needs urgent help");
  });

  it("returns an empty string for description when both enquiry and description are absent", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1")],
    });
    mockCaseGet.mockResolvedValue({
      data: makeCase("case-1", { enquiry: null, description: null }),
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].description).toBe("");
  });

  it("returns an empty string for description when the case is not found", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1")],
    });
    mockCaseGet.mockResolvedValue({ data: null });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].description).toBe("");
  });

  // ── priority and flag ───────────────────────────────────────────────────────

  it("uses priority and flag from the case record when found", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1")],
    });
    mockCaseGet.mockResolvedValue({
      data: makeCase("case-1", { priority: true, flag: true }),
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].priority).toBe(true);
    expect(result[0].flag).toBe(true);
  });

  it("defaults priority and flag to false when the case is not found", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1")],
    });
    mockCaseGet.mockResolvedValue({ data: null });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].priority).toBe(false);
    expect(result[0].flag).toBe(false);
  });

  // ── position and notes ──────────────────────────────────────────────────────

  it("uses ticket.position when it is set", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1", { position: 5 })],
    });
    mockCaseGet.mockResolvedValue({ data: makeCase("case-1") });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].position).toBe(5);
  });

  it("defaults position to 1 when ticket.position is null", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1", { position: null })],
    });
    mockCaseGet.mockResolvedValue({ data: makeCase("case-1") });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].position).toBe(1);
  });

  it("includes ticket.notes when present", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket("t1", "case-1", "dept-1", { notes: "Needs interpreter" }),
      ],
    });
    mockCaseGet.mockResolvedValue({ data: makeCase("case-1") });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].notes).toBe("Needs interpreter");
  });

  it("returns null for notes when ticket.notes is null", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket("t1", "case-1", "dept-1", { notes: null })],
    });
    mockCaseGet.mockResolvedValue({ data: makeCase("case-1") });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0].notes).toBeNull();
  });

  // ── Sorting ─────────────────────────────────────────────────────────────────

  it("returns items sorted by position ascending", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket("t3", "case-3", "dept-1", { position: 3 }),
        makeTicket("t1", "case-1", "dept-1", { position: 1 }),
        makeTicket("t2", "case-2", "dept-1", { position: 2 }),
      ],
    });
    mockCaseGet.mockImplementation(({ id }: { id: string }) =>
      Promise.resolve({ data: makeCase(id) }),
    );

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result.map((r) => r.ticketId)).toEqual(["t1", "t2", "t3"]);
  });

  // ── Case deduplication ──────────────────────────────────────────────────────

  it("fetches each unique caseId only once even when multiple tickets share a case", async () => {
    mockDepartmentList.mockResolvedValue({ data: [] });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket("t1", "shared-case", "dept-1", { position: 1 }),
        makeTicket("t2", "shared-case", "dept-1", { position: 2 }),
      ],
    });
    mockCaseGet.mockResolvedValue({ data: makeCase("shared-case") });

    await handler(makeEvent(), {} as any, {} as any);

    expect(mockCaseGet).toHaveBeenCalledTimes(1);
    expect(mockCaseGet).toHaveBeenCalledWith({ id: "shared-case" });
  });

  // ── Full item shape ─────────────────────────────────────────────────────────

  it("returns the full item shape with all fields correctly populated", async () => {
    mockDepartmentList.mockResolvedValue({
      data: [makeDept("dept-id-1", "Housing")],
    });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket("t1", "case-1", "dept-id-1", {
          ticketNumber: "TKT-001",
          position: 2,
          notes: "Priority appointment",
        }),
      ],
    });
    mockCaseGet.mockResolvedValue({
      data: makeCase("case-1", {
        referenceNumber: "REF-2024-001",
        enquiry: "Housing",
        description: "Urgent",
        priority: true,
        flag: false,
      }),
    });

    const result = await handler(makeEvent(), {} as any, {} as any);

    expect(result[0]).toEqual({
      ticketId: "t1",
      caseId: "case-1",
      ticketNumber: "TKT-001",
      department: "Housing",
      title: "REF-2024-001",
      description: "Housing — Urgent",
      priority: true,
      flag: false,
      position: 2,
      notes: "Priority appointment",
    });
  });
});
