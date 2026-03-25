import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockCaseGet, mockTicketListByCaseId, mockUserGet } = vi.hoisted(() => ({
  mockCaseGet: vi.fn(),
  mockTicketListByCaseId: vi.fn(),
  mockUserGet: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Case: {
        get: mockCaseGet,
      },
      Ticket: {
        listTicketByCaseId: mockTicketListByCaseId,
      },
      User: {
        get: mockUserGet,
      },
    },
  }),
}));

import { handler } from "../../../amplify/functions/getCaseDetails/handler";

const makeEvent = (args: { caseId?: string }) => ({ arguments: args }) as any;

const makeCase = (overrides = {}) => ({
  id: "case1",
  userId: "user1",
  name: "Test Case",
  referenceNumber: "REF001",
  departmentName: "Housing",
  description: "A description",
  status: "OPEN",
  priority: "HIGH",
  flag: false,
  notes: "Some notes",
  enquiry: "An enquiry",
  childrenCount: 2,
  householdSize: 4,
  ageRange: "30-40",
  hasDisabilityOrSensory: false,
  disabilityType: null,
  domesticAbuse: false,
  safeToContact: true,
  safeContactNotes: null,
  urgent: false,
  urgentReason: null,
  urgentReasonOtherText: null,
  supportNotes: null,
  supportNeedsJson: null,
  otherSupport: null,
  additionalInfo: null,
  ...overrides,
});

const makeTicket = (overrides = {}) => ({
  id: "ticket1",
  caseId: "case1",
  status: "WAITING",
  ...overrides,
});

const makeUser = (overrides = {}) => ({
  id: "user1",
  firstName: "Jane",
  lastName: "Doe",
  ...overrides,
});

describe("getCaseDetails handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error when caseId is missing", async () => {
    await expect(handler(makeEvent({}), {} as any, {} as any)).rejects.toThrow(
      "caseId required",
    );
  });

  it("throws error when case is not found", async () => {
    mockCaseGet.mockResolvedValue({ data: null });

    await expect(
      handler(makeEvent({ caseId: "case1" }), {} as any, {} as any),
    ).rejects.toThrow("Failed to find case with caseId case1");
  });

  it("returns case details with residentName when user is found", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });
    mockTicketListByCaseId.mockResolvedValue({
      data: [makeTicket(), makeTicket({ id: "ticket2", status: "COMPLETED" })],
    });
    mockUserGet.mockResolvedValue({ data: makeUser() });

    const result = await handler(
      makeEvent({ caseId: "case1" }),
      {} as any,
      {} as any,
    );

    expect(result).toMatchObject({
      caseName: "Test Case",
      referenceNumber: "REF001",
      departmentName: "Housing",
      status: "OPEN",
      residentName: "Jane Doe",
      tickets: [
        { ticketId: "ticket1", ticketStatus: "WAITING" },
        { ticketId: "ticket2", ticketStatus: "COMPLETED" },
      ],
    });
  });

  it("returns case details without residentName when user is not found", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });
    mockTicketListByCaseId.mockResolvedValue({ data: [] });
    mockUserGet.mockResolvedValue({ data: null });

    const result = await handler(
      makeEvent({ caseId: "case1" }),
      {} as any,
      {} as any,
    );

    expect(result!.tickets).toEqual([]);
    expect(result!.residentName).toBeUndefined();
  });

  it("Returns empty for null selectedTickets", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });
    mockTicketListByCaseId.mockResolvedValue({ data: null });
    mockUserGet.mockResolvedValue({ data: makeUser() });

    const result = await handler(
      makeEvent({ caseId: "case1" }),
      {} as any,
      {} as any,
    );

    expect(result!.tickets).toEqual([]);
  });

  it("maps ticket id and status to null when missing, and omits lastName when absent", async () => {
    mockCaseGet.mockResolvedValue({ data: makeCase() });
    mockTicketListByCaseId.mockResolvedValue({
      data: [makeTicket({ id: undefined, status: undefined })],
    });
    mockUserGet.mockResolvedValue({ data: makeUser({ lastName: undefined }) });

    const result = await handler(
      makeEvent({ caseId: "case1" }),
      {} as any,
      {} as any,
    );

    expect(result!.tickets).toEqual([{ ticketId: null, ticketStatus: null }]);
    expect(result!.residentName).toBe("Jane ");
  });
});
