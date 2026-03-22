import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockTicketList, mockTicketUpdate, mockDepartmentGet, mockDepartmentUpdate } =
  vi.hoisted(() => ({
    mockTicketList: vi.fn(),
    mockTicketUpdate: vi.fn(),
    mockDepartmentGet: vi.fn(),
    mockDepartmentUpdate: vi.fn(),
  }));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Ticket: {
        list: mockTicketList,
        update: mockTicketUpdate,
      },
      Department: {
        get: mockDepartmentGet,
        update: mockDepartmentUpdate,
      },
    },
  }),
}));

import { recalculateDepartmentQueue } from "../../../amplify/functions/utils/recalculateDepartmentQueue";

// All ticket timestamps are anchored to this base time
const BASE_TIME = new Date("2025-01-01T09:00:00.000Z").getTime();
const isoAtMinutes = (minutesOffset: number) =>
  new Date(BASE_TIME + minutesOffset * 60000).toISOString();

const makeWaitingTicket = (id: string, position: number) => ({
  id,
  status: "WAITING" as const,
  position,
  createdAt: isoAtMinutes(0),
  completedAt: null,
  departmentName: DEPT_NAME,
});

// durationMinutes controls how long the ticket took (completedAt - createdAt)
const makeCompletedTicket = (id: string, durationMinutes: number) => ({
  id,
  status: "COMPLETED" as const,
  position: -1,
  createdAt: isoAtMinutes(0),
  completedAt: isoAtMinutes(durationMinutes),
  departmentName: DEPT_NAME,
});

const DEPT_NAME = "Homelessness";

const makeDepartment = (estimatedWaitingTime: number | null = 45, name = DEPT_NAME) => ({
  id: name,
  name,
  estimatedWaitingTime,
});

describe("recalculateDepartmentQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTicketUpdate.mockResolvedValue({ data: {} });
    mockDepartmentUpdate.mockResolvedValue({ data: {} });
  });

  it("throws when no tickets are found for the department today", async () => {
    mockTicketList.mockResolvedValue({ data: [] });

    await expect(recalculateDepartmentQueue(DEPT_NAME)).rejects.toThrow(
      `No tickets found for department ${DEPT_NAME} for today`,
    );
  });

  it("throws when the department record is not found", async () => {
    mockTicketList.mockResolvedValue({ data: [makeWaitingTicket("w1", 0)] });
    mockDepartmentGet.mockResolvedValue({ data: null });

    await expect(recalculateDepartmentQueue(DEPT_NAME)).rejects.toThrow(
      `Department ${DEPT_NAME} not found`,
    );
  });

  it("returns true on success", async () => {
    mockTicketList.mockResolvedValue({ data: [makeWaitingTicket("w1", 0)] });
    mockDepartmentGet.mockResolvedValue({ data: makeDepartment(30) });

    const result = await recalculateDepartmentQueue(DEPT_NAME);

    expect(result).toBe(true);
  });

  it("reassigns waiting tickets to positions 0, 1, 2... sorted by original position", async () => {
    mockTicketList.mockResolvedValue({
      data: [
        makeWaitingTicket("t3", 5),
        makeWaitingTicket("t1", 1),
        makeWaitingTicket("t2", 3),
      ],
    });
    mockDepartmentGet.mockResolvedValue({ data: makeDepartment(30) });

    await recalculateDepartmentQueue(DEPT_NAME);

    // Sorted by position: t1(1) - 0, t2(3) - 1, t3(5) - 2
    expect(mockTicketUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "t1", position: 0 }));
    expect(mockTicketUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "t2", position: 1 }));
    expect(mockTicketUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "t3", position: 2 }));
  });

  it("does not call Ticket.update for completed tickets", async () => {
    mockTicketList.mockResolvedValue({
      data: [
        makeWaitingTicket("w1", 0),
        makeCompletedTicket("c1", 20),
        makeCompletedTicket("c2", 30),
      ],
    });
    mockDepartmentGet.mockResolvedValue({ data: makeDepartment(30) });

    await recalculateDepartmentQueue(DEPT_NAME);

    expect(mockTicketUpdate).toHaveBeenCalledTimes(1);
    expect(mockTicketUpdate).toHaveBeenCalledWith(expect.objectContaining({ id: "w1" }));
  });

  describe("with fewer than 5 completed tickets", () => {
    it("uses department.estimatedWaitingTime for wait time bounds", async () => {
      mockTicketList.mockResolvedValue({
        data: [
          makeWaitingTicket("w1", 0),
          makeWaitingTicket("w2", 1),
          makeCompletedTicket("c1", 20),
        ],
      });
      mockDepartmentGet.mockResolvedValue({ data: makeDepartment(40) });

      await recalculateDepartmentQueue(DEPT_NAME);

      // position 0: lower = round(40 * 0) = 0, upper = 0 + 20 = 20
      expect(mockTicketUpdate).toHaveBeenCalledWith({
        id: "w1",
        position: 0,
        estimatedWaitTimeLower: 0,
        estimatedWaitTimeUpper: 20,
      });
      // position 1: lower = round(40 * 1) = 40, upper = 40 + 20 = 60
      expect(mockTicketUpdate).toHaveBeenCalledWith({
        id: "w2",
        position: 1,
        estimatedWaitTimeLower: 40,
        estimatedWaitTimeUpper: 60,
      });
    });

    it("falls back to the default wait time when department has no estimatedWaitingTime", async () => {
      mockTicketList.mockResolvedValue({
        data: [
          makeWaitingTicket("w1", 0),
          makeWaitingTicket("w2", 1),
        ],
      });
      // estimatedWaitingTime: null - falls back to getDefaultEstimatedWaitingTime("Homelessness") = 100
      mockDepartmentGet.mockResolvedValue({ data: makeDepartment(null, "Homelessness") });

      await recalculateDepartmentQueue(DEPT_NAME);

      // position 0: lower = round(100 * 0) = 0, upper = 20
      expect(mockTicketUpdate).toHaveBeenCalledWith({
        id: "w1",
        position: 0,
        estimatedWaitTimeLower: 0,
        estimatedWaitTimeUpper: 20,
      });
      // position 1: lower = round(100 * 1) = 100, upper = 120
      expect(mockTicketUpdate).toHaveBeenCalledWith({
        id: "w2",
        position: 1,
        estimatedWaitTimeLower: 100,
        estimatedWaitTimeUpper: 120,
      });
    });

    it("does not call Department.update", async () => {
      mockTicketList.mockResolvedValue({
        data: [
          makeWaitingTicket("w1", 0),
          makeCompletedTicket("c1", 10),
          makeCompletedTicket("c2", 20),
        ],
      });
      mockDepartmentGet.mockResolvedValue({ data: makeDepartment(30) });

      await recalculateDepartmentQueue(DEPT_NAME);

      expect(mockDepartmentUpdate).not.toHaveBeenCalled();
    });
  });

  describe("with 5 or more completed tickets", () => {
    // Durations: 10, 20, 30, 40, 50 min - sorted median = values[2] = 30
    const fiveCompletedTickets = [
      makeCompletedTicket("c1", 10),
      makeCompletedTicket("c2", 20),
      makeCompletedTicket("c3", 30),
      makeCompletedTicket("c4", 40),
      makeCompletedTicket("c5", 50),
    ];

    it("updates Department.estimatedWaitingTime with the median of completed durations", async () => {
      mockTicketList.mockResolvedValue({
        data: [...fiveCompletedTickets, makeWaitingTicket("w1", 0)],
      });
      mockDepartmentGet.mockResolvedValue({ data: makeDepartment(999) });

      await recalculateDepartmentQueue(DEPT_NAME);

      expect(mockDepartmentUpdate).toHaveBeenCalledWith({
        id: DEPT_NAME,
        estimatedWaitingTime: 30,
      });
    });

    it("uses the median duration for waiting ticket wait time bounds", async () => {
      mockTicketList.mockResolvedValue({
        data: [...fiveCompletedTickets, makeWaitingTicket("w1", 0), makeWaitingTicket("w2", 1)],
      });
      mockDepartmentGet.mockResolvedValue({ data: makeDepartment(999) });

      await recalculateDepartmentQueue(DEPT_NAME);

      // median = 30 min
      // position 0: lower = round(30 * 0) = 0, upper = 20
      expect(mockTicketUpdate).toHaveBeenCalledWith({
        id: "w1",
        position: 0,
        estimatedWaitTimeLower: 0,
        estimatedWaitTimeUpper: 20,
      });
      // position 1: lower = round(30 * 1) = 30, upper = 50
      expect(mockTicketUpdate).toHaveBeenCalledWith({
        id: "w2",
        position: 1,
        estimatedWaitTimeLower: 30,
        estimatedWaitTimeUpper: 50,
      });
    });

    it("clamps estimatedWaitingTime to 1 when median rounds to 0", async () => {
      // All 5 tickets have very short durations (0.4 min each) — median = 0.4, Math.round = 0, clamped to 1
      const shortDurationTickets = Array.from({ length: 5 }, (_, i) => ({
        ...makeCompletedTicket(`c${i + 1}`, 0),
        completedAt: new Date(BASE_TIME + 0.4 * 60000).toISOString(),
      }));

      mockTicketList.mockResolvedValue({
        data: [...shortDurationTickets, makeWaitingTicket("w1", 0)],
      });
      mockDepartmentGet.mockResolvedValue({ data: makeDepartment(999) });

      await recalculateDepartmentQueue(DEPT_NAME);

      expect(mockDepartmentUpdate).toHaveBeenCalledWith({
        id: DEPT_NAME,
        estimatedWaitingTime: 1,
      });
    });

    it("does not update Department when all completed ticket durations are zero", async () => {
      // createdAt === completedAt - duration = 0 for all - median = 0 - Department.update NOT called
      const zeroDurationTickets = fiveCompletedTickets.map((t) => ({
        ...t,
        completedAt: isoAtMinutes(0),
      }));

      mockTicketList.mockResolvedValue({
        data: [...zeroDurationTickets, makeWaitingTicket("w1", 0)],
      });
      mockDepartmentGet.mockResolvedValue({ data: makeDepartment(999) });

      await recalculateDepartmentQueue(DEPT_NAME);

      expect(mockDepartmentUpdate).not.toHaveBeenCalled();
    });

    it("only uses the 5 most recent completed tickets for the median", async () => {
      // c6 has the earliest completedAt (1 min) so it gets dropped by the slice(0, 5)
      // Its duration would be 1 min, which would skew the median if included
      // Override createdAt to decouple duration from completedAt:
      // completedAt = isoAtMinutes(1) - stays oldest, gets dropped by slice
      // duration = isoAtMinutes(1) - isoAtMinutes(-100) = 101 min - shifts median to 40 if included
      const c6_oldest = { ...makeCompletedTicket("c6", 1), createdAt: isoAtMinutes(-100) };

      mockTicketList.mockResolvedValue({
        data: [...fiveCompletedTickets, c6_oldest, makeWaitingTicket("w1", 0)],
      });
      mockDepartmentGet.mockResolvedValue({ data: makeDepartment(999) });

      await recalculateDepartmentQueue(DEPT_NAME);

      // The 5 kept (by most recent completedAt): c5(50), c4(40), c3(30), c2(20), c1(10)
      // c6_oldest (completedAt=1min) is cut — median of remaining = 30
      expect(mockDepartmentUpdate).toHaveBeenCalledWith({
        id: DEPT_NAME,
        estimatedWaitingTime: 30,
      });
    });
  });
});
