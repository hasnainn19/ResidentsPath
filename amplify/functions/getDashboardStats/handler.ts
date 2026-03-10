import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";
import { getAmplifyClient } from "../utils/amplifyClient";

export const handler: Schema["getDashboardStats"]["functionHandler"] = async (
  event,
) => {
  // Initialize Amplify client with admin permissions
  const client = await getAmplifyClient();

  // Query all tickets#
  const { data: tickets } = await client.models.Ticket.list();
  const { data: staff } = await client.models.Staff.list();
  const { data: cases } = await client.models.Case.list();

  const waitingTickets = tickets.filter((t) => t.status === "WAITING");

  return {
    waitingCount: waitingTickets.length,
    steppedOutCount: tickets.filter((t) => t.steppedOut === true).length,
    staffCount: staff.filter((s) => s.isAvailable).length,
    urgentCount: (() => {
      const priorityCaseIds = new Set(
        cases
          .filter(
            (c) =>
              c.priority === true &&
              (c.status === "OPEN" || c.status === "IN_PROGRESS"),
          )
          .map((c) => c.id),
      );
      return tickets.filter((t) => priorityCaseIds.has(t.caseId)).length;
    })(),
    longestWaitTime:
      waitingTickets.length > 0
        ? Math.max(...waitingTickets.map((t) => t.estimatedWaitTimeUpper || 0))
        : 0,
  };
};
