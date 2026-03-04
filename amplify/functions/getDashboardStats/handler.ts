import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";

export const handler: Schema["getDashboardStats"]["functionHandler"] = async (
  event,
) => {
  // Initialize Amplify client with admin permissions
  const client = generateClient<Schema>({
    authMode: "identityPool",
  });

  // Query all tickets#
  const { data: tickets } = await client.models.Ticket.list();
  const { data: staff } = await client.models.Staff.list();

  return {
    waitingCount: tickets.filter((t) => t.status === "WAITING").length,
    steppedOutCount: tickets.filter((t) => t.status === "STEPPED_OUT").length,
    staffCount: staff.filter((s) => s.isAvailable).length,
    urgentCount: tickets.filter((t) => t.urgency === "CRITICAL").length, //TODO: Change to priority in schema,
    longestWaitTime: Math.max(
      ...tickets.map((t) => t.estimatedWaitTimeUpper || 0),
    ),
  };
};
