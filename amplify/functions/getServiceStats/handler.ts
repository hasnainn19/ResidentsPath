import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

export const handler: Schema["getServiceStats"]["functionHandler"] = async (
  _event,
) => {
  const client = await getAmplifyClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data: rawTickets } = await client.models.Ticket.list({
    filter: {
      status: { eq: "WAITING" },
      createdAt: {
        ge: startOfDay.toISOString(),
        le: endOfDay.toISOString(),
      },
    },
  });
  const tickets = rawTickets.filter(Boolean);
  const { data: rawStaff } = await client.models.Staff.list({
    filter: { isAvailable: { eq: true } },
  });
  const staff = rawStaff.filter(Boolean);
  const todayCaseIds = new Set(tickets.map((t) => t.caseId));
  const { data: rawCases } = await client.models.Case.list({
    filter: {
      or: [{ status: { eq: "OPEN" } }, { status: { eq: "IN_PROGRESS" } }],
    },
  });
  const cases = rawCases.filter(Boolean).filter((c) => todayCaseIds.has(c.id));
  const { data: rawDepartments } = await client.models.Department.list();
  const departments = rawDepartments.filter(Boolean);

  const getCase = (caseId: string) => {
    return cases.find((c) => c.id === caseId);
  };

  const getWaitingCount = (departmentId: string) => {
    return tickets.filter((t) => t.departmentId === departmentId).length;
  };

  const getLongestWait = (departmentId: string) => {
    const waiting = tickets
      .filter((t) => t.departmentId === departmentId)
      .map((t) => t.estimatedWaitTimeUpper);
    if (waiting.length === 0) return 0;
    return Math.max(...waiting);
  };

  const getAverageWait = (departmentId: string) => {
    const waiting = tickets
      .filter((t) => t.departmentId === departmentId)
      .map((t) =>
        Math.floor((t.estimatedWaitTimeLower + t.estimatedWaitTimeUpper) / 2),
      );
    if (waiting.length === 0) return 0;
    const sum = waiting.reduce((a, b) => a + b);
    return Math.floor(sum / waiting.length);
  };

  const getPriorityCaseCount = (departmentId: string) => {
    return tickets.filter((t) => {
      const c = getCase(t.caseId);
      return t.departmentId === departmentId && c?.priority === true;
    }).length;
  };

  const getStandardCaseCount = (departmentId: string) => {
    return tickets.filter((t) => {
      const c = getCase(t.caseId);
      return t.departmentId === departmentId && c?.priority !== true;
    }).length;
  };

  const getSteppedOutCount = (departmentId: string) => {
    return tickets.filter(
      (t) => t.steppedOut === true && t.departmentId === departmentId,
    ).length;
  };

  const getAvailableStaff = (departmentId: string) => {
    return staff.filter((s) => s.departmentId === departmentId).length;
  };

  const results = departments.map((d) => ({
    departmentName: d.name ?? "",
    waitingCount: getWaitingCount(d.id),
    longestWait: getLongestWait(d.id),
    averageWait: getAverageWait(d.id),
    priorityCaseCount: getPriorityCaseCount(d.id),
    standardCaseCount: getStandardCaseCount(d.id),
    steppedOutCount: getSteppedOutCount(d.id),
    availableStaff: getAvailableStaff(d.id),
  }));

  return results;
};
