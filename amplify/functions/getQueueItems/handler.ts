import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

/**
 * Lambda function to fetch today's waiting queue items for a department.
 *
 * Returns all WAITING tickets for today, optionally filtered to a specific
 * department by name. Each item joins the ticket with its case to provide
 * the reference number, description, priority status, and queue position.
 *
 * @param event.arguments.departmentName - Optional department name to filter by
 * @returns Array of QueueItem objects sorted by position
 */

const client = await getAmplifyClient();

export const handler: Schema["getQueueItems"]["functionHandler"] = async (event) => {
  const { departmentName } = event.arguments;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all departments to resolve IDs for filtering and display
  const { data: departments } = await client.models.Department.list();
  const deptMap = new Map(departments.filter(Boolean).map((d) => [d.id, d]));

  const selectedDept = departmentName
    ? departments.find((d) => d.name === departmentName)
    : null;

  const ticketFilter = {
    status: { eq: "WAITING" as const },
    createdAt: {
      ge: startOfDay.toISOString(),
      le: endOfDay.toISOString(),
    },
    ...(selectedDept ? { departmentId: { eq: selectedDept.id } } : {}),
  };

  const { data: tickets } = await client.models.Ticket.list({
    filter: ticketFilter,
  });

  if (!tickets || tickets.length === 0) return [];

  // Fetch only the cases referenced by the returned tickets
  const caseIds = [...new Set(tickets.map((t) => t.caseId))];
  const caseResults = await Promise.all(
    caseIds.map((id) => client.models.Case.get({ id })),
  );
  const caseMap = new Map(
    caseResults
      .map((r) => r.data)
      .filter(Boolean)
      .map((c) => [c!.id, c!]),
  );

  const items = tickets.map((ticket) => {
    const caseRecord = caseMap.get(ticket.caseId);
    const dept = deptMap.get(ticket.departmentId);

    return {
      ticketId: ticket.id,
      caseId: ticket.caseId,
      ticketNumber: ticket.ticketNumber,
      department: dept?.name ?? ticket.departmentId,
      title: caseRecord?.referenceNumber ?? ticket.ticketNumber,
      description: [caseRecord?.enquiry, caseRecord?.description]
        .filter(Boolean)
        .join(" — "),
      priority: caseRecord?.priority ?? false,
      flag: caseRecord?.flag ?? false,
      position: ticket.position ?? 1,
      notes: ticket.notes ?? null,
    };
  });

  return items.sort((a, b) => a.position - b.position);
};
