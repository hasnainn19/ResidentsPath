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

  const { data: tickets } = await client.models.Ticket.list({
    filter: {
      status: { eq: "WAITING" },
      createdAt: {
        ge: startOfDay.toISOString(),
        le: endOfDay.toISOString(),
      },
    },
  });
  const { data: staff } = await client.models.Staff.list({
    filter: { isAvailable: { eq: true } },
  });
  const todayCaseIds = new Set(tickets.map((t) => t.caseId));
  const { data: rawCases } = await client.models.Case.list({
    filter: {
      or: [{ status: { eq: "OPEN" } }, { status: { eq: "IN_PROGRESS" } }],
    },
  });
  const cases = rawCases.filter((c) => todayCaseIds.has(c.id));
  const { data: departments } = await client.models.Department.list();

  const getCase = (caseId: string) => {
    return cases.find((c) => c.id === caseId);
  };

  const getWaitingCount = (departmentName: string) => {
    return tickets.filter((t) => t.departmentName === departmentName).length;
  };

  const getLongestWait = (departmentName: string) => {
    const waiting = tickets
      .filter((t) => t.departmentName === departmentName)
      .map((t) => t.estimatedWaitTimeUpper);
    if (waiting.length === 0) return 0;
    return Math.max(...waiting);
  };

  const getAverageWait = (departmentName: string) => {
    const waiting = tickets
      .filter((t) => t.departmentName === departmentName)
      .map((t) =>
        Math.floor((t.estimatedWaitTimeLower + t.estimatedWaitTimeUpper) / 2),
      );
    if (waiting.length === 0) return 0;
    const sum = waiting.reduce((a, b) => a + b);
    return Math.floor(sum / waiting.length);
  };

  const getPriorityCaseCount = (departmentName: string) => {
    return tickets.filter((t) => {
      const c = getCase(t.caseId);
      return t.departmentName === departmentName && c?.priority === true;
    }).length;
  };

  const getStandardCaseCount = (departmentName: string) => {
    return tickets.filter((t) => {
      const c = getCase(t.caseId);
      return t.departmentName === departmentName && c?.priority !== true;
    }).length;
  };

  const getSteppedOutCount = (departmentName: string) => {
    return tickets.filter(
      (t) => t.steppedOut === true && t.departmentName === departmentName,
    ).length;
  };

  const getAvailableStaff = (departmentName: string) => {
    return staff.filter((s) => s.departmentName === departmentName).length;
  };

  const results = departments.map((d) => ({
    departmentName: d.name ?? d.id,
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
