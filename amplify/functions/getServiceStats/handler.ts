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
  const { data: cases } = await client.models.Case.list();
  const { data: departments } = await client.models.Department.list();

  const getCase = (caseId: string) => {
    return cases.find((c) => c.id === caseId);
  };

  const getWaitingCount = (departmentId: string) => {
    return tickets.filter((t) => t.departmentId === departmentId).length;
  };

  const getLongestWait = (departmentId: string) => {
    const waiting = tickets.filter((t) => t.departmentId === departmentId);
    if (waiting.length === 0) return 0;
    return Math.max(...waiting.map((t) => t.estimatedWaitTimeUpper || 0));
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
    priorityCaseCount: getPriorityCaseCount(d.id),
    standardCaseCount: getStandardCaseCount(d.id),
    steppedOutCount: getSteppedOutCount(d.id),
    availableStaff: getAvailableStaff(d.id),
  }));

  return results;
};
