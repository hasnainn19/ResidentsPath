import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

export const handler: Schema["getServiceStats"]["functionHandler"] = async (
  event,
) => {
  const client = await getAmplifyClient();

  const { data: tickets } = await client.models.Ticket.list();
  const { data: staff } = await client.models.Staff.list();
  const { data: cases } = await client.models.Case.list();
  const { data: departments } = await client.models.Department.list();

  const getCase = (caseId: string) => {
    return cases.find((c) => c.id === caseId);
  };

  const getWaitingCount = (departmentId: string) => {
    return tickets.filter(
      (t) =>
        t.status === "WAITING" &&
        !t.steppedOut &&
        t.departmentId === departmentId,
    ).length;
  };

  const getLongestWait = (departmentId: string) => {
    const waiting = tickets.filter(
      (t) =>
        t.status === "WAITING" &&
        !t.steppedOut &&
        t.departmentId === departmentId,
    );
    if (waiting.length === 0) return 0;
    return Math.max(...waiting.map((t) => t.estimatedWaitTimeUpper || 0));
  };

  const getPriorityCaseCount = (departmentId: string) => {
    return tickets.filter((t) => {
      const c = getCase(t.caseId);
      return (
        t.status === "WAITING" &&
        !t.steppedOut &&
        t.departmentId === departmentId &&
        c?.priority === true
      );
    }).length;
  };

  const getStandardCaseCount = (departmentId: string) => {
    return tickets.filter((t) => {
      const c = getCase(t.caseId);
      return (
        t.status === "WAITING" &&
        !t.steppedOut &&
        t.departmentId === departmentId &&
        c?.priority !== true
      );
    }).length;
  };

  const getSteppedOutCount = (departmentId: string) => {
    return tickets.filter(
      (t) =>
        t.status === "WAITING" &&
        t.steppedOut === true &&
        t.departmentId === departmentId,
    ).length;
  };

  const getAvailableStaff = (departmentId: string) => {
    return staff.filter((s) => s.departmentId === departmentId && s.isAvailable)
      .length;
  };

  const results = departments.map((d) => ({
    serviceName: d.name ?? "",
    waitingCount: getWaitingCount(d.id),
    longestWait: getLongestWait(d.id),
    priorityCaseCount: getPriorityCaseCount(d.id),
    standardCaseCount: getStandardCaseCount(d.id),
    steppedOutCount: getSteppedOutCount(d.id),
    availableStaff: getAvailableStaff(d.id),
  }));

  return results;
};
