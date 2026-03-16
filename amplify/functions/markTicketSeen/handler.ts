import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";
import { recalculateDepartmentQueue } from "../utils/recalculateDepartmentQueue";

/**
 * Lambda function to mark a ticket as seen (completed).
 *
 * Sets the ticket's status to COMPLETED, position to -1, and
 * records the completion timestamp.
 *
 * @param event.arguments.ticketId - ID of the ticket to mark as seen
 * @returns true if the update was successful
 */

const client = await getAmplifyClient();

export const handler: Schema["markTicketSeen"]["functionHandler"] = async (
  event,
) => {
  const { ticketId } = event.arguments;

  if (!ticketId) {
    throw new Error("ticketId is required");
  }

  const { data: ticket } = await client.models.Ticket.get({ id: ticketId });
  if (!ticket) {
    throw new Error(`Ticket ${ticketId} not found`);
  }

  if (ticket.position == null) {
    throw new Error(`Ticket ${ticketId} does not have a position assigned`);
  }

  const completedPosition = ticket.position;

  try {
    await client.models.Ticket.update({
      id: ticketId,
      status: "COMPLETED",
      position: -1,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Failed to update ticket:${ticketId}.`);
  }

  // Fetch today's waiting tickets for the department
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data: allTickets } = await client.models.Ticket.list({
    filter: {
      departmentId: { eq: ticket.departmentId },
      status: { eq: "WAITING" },
      createdAt: {
        ge: startOfDay.toISOString(),
        le: endOfDay.toISOString(),
      },
    },
  });

  const waitingTickets = (allTickets ?? []).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  // Shift down all tickets that were below the completed ticket
  try {
    await Promise.all(
      waitingTickets
        .filter((t) => (t.position ?? 0) > completedPosition)
        .map((t) =>
          client.models.Ticket.update({
            id: t.id,
            position: (t.position ?? 0) - 1,
          }),
        ),
    );
  } catch (error) {
    console.error(
      `Failed to reposition tickets for department ${ticket.departmentId}`,
    );
  }

  // Recalculate wait times
  try {
    await recalculateDepartmentQueue(ticket.departmentId);
  } 
  catch (error) {
    console.error(`recalculateDepartmentQueue: failed for department ${ticket.departmentId}`, error);
  }

  return true;
};
