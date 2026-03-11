import type { Schema } from "../../data/resource";

import { getAmplifyClient } from "../utils/amplifyClient";

export const handler: Schema["getDashboardStats"]["functionHandler"] = async (
  event,
) => {
  // Initialize Amplify client with admin permissions
  const client = await getAmplifyClient();

  // Query all tickets#
  const { data: tickets } = await client.models.Ticket.list({
    filter: {
      status: { eq: "WAITING" },
    },
  });
  const { data: staff } = await client.models.Staff.list({
    filter: {
      isAvailable: { eq: true },
    },
  });
  const { data: cases } = await client.models.Case.list({
    filter: {
      or: [{ status: { eq: "OPEN" } }, { status: { eq: "IN_PROGRESS" } }],
      priority: { eq: true },
    },
  });

  return {
    waitingCount: tickets.length,
    steppedOutCount: tickets.filter((t) => t.steppedOut === true).length,
    staffCount: staff.length,
    urgentCount: (() => {
      const caseIDs = new Set(cases.map((c) => c.id));
      return tickets.filter((t) => caseIDs.has(t.caseId)).length;
    })(),
    longestWaitTime:
      tickets.length > 0
        ? Math.max(...tickets.map((t) => t.estimatedWaitTimeUpper || 0))
        : 0,
  };
};
