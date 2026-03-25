import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockTicketList, mockStaffList, mockCaseList, mockDepartmentList } =
  vi.hoisted(() => ({
    mockTicketList: vi.fn(),
    mockStaffList: vi.fn(),
    mockCaseList: vi.fn(),
    mockDepartmentList: vi.fn(),
  }));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Ticket: { list: mockTicketList },
      Staff: { list: mockStaffList },
      Case: { list: mockCaseList },
      Department: { list: mockDepartmentList },
    },
  }),
}));

import { handler } from "../../../amplify/functions/getServiceStats/handler";

const makeTicket = (overrides: Record<string, unknown> = {}) => ({
  id: "t1",
  caseId: "c1",
  departmentName: "dept-1",
  status: "WAITING",
  estimatedWaitTimeLower: 10,
  estimatedWaitTimeUpper: 20,
  steppedOut: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const makeStaff = (overrides: Record<string, unknown> = {}) => ({
  id: "s1",
  departmentName: "dept-1",
  isAvailable: true,
  ...overrides,
});

const makeCase = (overrides: Record<string, unknown> = {}) => ({
  id: "c1",
  status: "OPEN",
  priority: false,
  ...overrides,
});

const makeDepartment = (overrides: Record<string, unknown> = {}) => ({
  id: "dept-1",
  name: "Department One",
  ...overrides,
});

const callHandler = () => (handler as (e: unknown) => Promise<unknown[]>)({});

describe("getServiceStats handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTicketList.mockResolvedValue({ data: [] });
    mockStaffList.mockResolvedValue({ data: [] });
    mockCaseList.mockResolvedValue({ data: [] });
    mockDepartmentList.mockResolvedValue({ data: [] });
  });

  it("returns an empty array when there are no departments", async () => {
    const result = await callHandler();
    expect(result).toEqual([]);
  });

  it("returns a zeroed-out entry for a department with no tickets or staff", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });

    const [dept] = (await callHandler()) as any[];

    expect(dept).toEqual({
      departmentName: "Department One",
      waitingCount: 0,
      longestWait: 0,
      averageWait: 0,
      priorityCaseCount: 0,
      standardCaseCount: 0,
      steppedOutCount: 0,
      availableStaff: 0,
    });
  });

  it("uses department id as name when name is null", async () => {
    mockDepartmentList.mockResolvedValue({
      data: [makeDepartment({ name: null })],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.departmentName).toBe("dept-1");
  });

  it("uses department id as name when name is undefined", async () => {
    mockDepartmentList.mockResolvedValue({
      data: [makeDepartment({ name: undefined })],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.departmentName).toBe("dept-1");
  });

  it("counts tickets belonging to the department", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket({ departmentName: "dept-1" }),
        makeTicket({ id: "t2", departmentName: "dept-1" }),
        makeTicket({ id: "t3", departmentName: "other-dept" }),
      ],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.waitingCount).toBe(2);
  });

  it("returns the maximum estimatedWaitTimeUpper for the department", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket({ estimatedWaitTimeUpper: 30 }),
        makeTicket({ id: "t2", estimatedWaitTimeUpper: 50 }),
        makeTicket({ id: "t3", estimatedWaitTimeUpper: 10 }),
      ],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.longestWait).toBe(50);
  });

  it("returns 0 for longestWait when no tickets match the department", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket({ departmentName: "other-dept" })],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.longestWait).toBe(0);
  });

  it("returns the floored average of midpoints for the department", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket({ estimatedWaitTimeLower: 10, estimatedWaitTimeUpper: 20 }),
        makeTicket({
          id: "t2",
          estimatedWaitTimeLower: 5,
          estimatedWaitTimeUpper: 16,
        }),
      ],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.averageWait).toBe(12);
  });

  it("returns 0 for averageWait when no tickets match the department", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket({ departmentName: "other-dept" })],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.averageWait).toBe(0);
  });

  it("counts priority tickets when the linked case has priority === true", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket({ caseId: "c1" }),
        makeTicket({ id: "t2", caseId: "c2" }),
      ],
    });
    mockCaseList.mockResolvedValue({
      data: [
        makeCase({ id: "c1", priority: true }),
        makeCase({ id: "c2", priority: false }),
      ],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.priorityCaseCount).toBe(1);
    expect(dept.standardCaseCount).toBe(1);
  });

  it("treats a ticket whose case is not in the filtered list as standard", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket({ caseId: "c1" })],
    });
    // The case list returns a different case — c1 is not in the filtered set.
    mockCaseList.mockResolvedValue({
      data: [makeCase({ id: "c999", priority: true })],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.priorityCaseCount).toBe(0);
    expect(dept.standardCaseCount).toBe(1);
  });

  it("filters cases to only those whose id appears in today's ticket caseIds", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket({ caseId: "c1" })],
    });
    mockCaseList.mockResolvedValue({
      data: [
        makeCase({ id: "c1", priority: true }),
        makeCase({ id: "c999", priority: false }),
      ],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.priorityCaseCount).toBe(1);
    expect(dept.standardCaseCount).toBe(0);
  });

  it("counts all tickets as standard when no cases are available", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [makeTicket(), makeTicket({ id: "t2" })],
    });
    mockCaseList.mockResolvedValue({ data: [] });

    const [dept] = (await callHandler()) as any[];
    expect(dept.priorityCaseCount).toBe(0);
    expect(dept.standardCaseCount).toBe(2);
  });

  it("counts only stepped-out tickets for the department", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket({ steppedOut: true }),
        makeTicket({ id: "t2", steppedOut: false }),
        makeTicket({ id: "t3", steppedOut: true }),
        makeTicket({
          id: "t4",
          steppedOut: true,
          departmentName: "other-dept",
        }),
      ],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.steppedOutCount).toBe(2);
  });

  it("counts only staff assigned to the department", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockStaffList.mockResolvedValue({
      data: [
        makeStaff({ departmentName: "dept-1" }),
        makeStaff({ id: "s2", departmentName: "dept-1" }),
        makeStaff({ id: "s3", departmentName: "other-dept" }),
      ],
    });

    const [dept] = (await callHandler()) as any[];
    expect(dept.availableStaff).toBe(2);
  });

  it("returns a separate entry for each department with correct isolated stats", async () => {
    mockDepartmentList.mockResolvedValue({
      data: [
        makeDepartment({ id: "dept-1", name: "Dept One" }),
        makeDepartment({ id: "dept-2", name: "Dept Two" }),
      ],
    });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket({ id: "t1", departmentName: "dept-1", caseId: "c1" }),
        makeTicket({ id: "t2", departmentName: "dept-2", caseId: "c2" }),
      ],
    });
    mockCaseList.mockResolvedValue({
      data: [
        makeCase({ id: "c1", priority: true }),
        makeCase({ id: "c2", priority: false }),
      ],
    });
    mockStaffList.mockResolvedValue({
      data: [makeStaff({ id: "s1", departmentName: "dept-1" })],
    });

    const results = (await callHandler()) as any[];
    expect(results).toHaveLength(2);

    const d1 = results.find((r: any) => r.departmentName === "Dept One");
    const d2 = results.find((r: any) => r.departmentName === "Dept Two");

    expect(d1.waitingCount).toBe(1);
    expect(d1.priorityCaseCount).toBe(1);
    expect(d1.standardCaseCount).toBe(0);
    expect(d1.availableStaff).toBe(1);

    expect(d2.waitingCount).toBe(1);
    expect(d2.priorityCaseCount).toBe(0);
    expect(d2.standardCaseCount).toBe(1);
    expect(d2.availableStaff).toBe(0);
  });

  it("returns the correct full stats object for a single department with all fields populated", async () => {
    mockDepartmentList.mockResolvedValue({ data: [makeDepartment()] });
    mockTicketList.mockResolvedValue({
      data: [
        makeTicket({
          id: "t1",
          caseId: "c1",
          departmentName: "dept-1",
          estimatedWaitTimeLower: 10,
          estimatedWaitTimeUpper: 30,
          steppedOut: true,
        }),
        makeTicket({
          id: "t2",
          caseId: "c2",
          departmentName: "dept-1",
          estimatedWaitTimeLower: 20,
          estimatedWaitTimeUpper: 40,
          steppedOut: false,
        }),
      ],
    });
    mockCaseList.mockResolvedValue({
      data: [
        makeCase({ id: "c1", priority: true }),
        makeCase({ id: "c2", priority: false }),
      ],
    });
    mockStaffList.mockResolvedValue({
      data: [makeStaff(), makeStaff({ id: "s2" })],
    });

    const [dept] = (await callHandler()) as any[];

    expect(dept).toEqual({
      departmentName: "Department One",
      waitingCount: 2,
      longestWait: 40,
      averageWait: 25,
      priorityCaseCount: 1,
      standardCaseCount: 1,
      steppedOutCount: 1,
      availableStaff: 2,
    });
  });
});
