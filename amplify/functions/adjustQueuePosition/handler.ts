import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

/**
 * Lambda function to move a waiting ticket to a new queue position.
 *
 * Accepts a ticketId and a 1-based newPosition. It fetches all WAITING
 * tickets for the ticket's department today, removes the target ticket from
 * its current slot, inserts it at the requested position, then writes the
 * updated 0-based positions and recalculated wait time bounds back to every
 * affected ticket.
 *
 * @param event.arguments.ticketId    - ID of the ticket to reposition
 * @param event.arguments.newPosition - Desired 1-based position in the queue
 * @returns true if the repositioning and updates were successful
 */

const client = await getAmplifyClient();

export const handler: Schema["adjustQueuePosition"]["functionHandler"] = async (
  event,
) => {
  const { ticketId, newPosition } = event.arguments;

  if (!ticketId || newPosition == null) {
    throw new Error("ticketId and newPosition are required");
  }

  // Fetch the target ticket to get its department
  const { data: ticket } = await client.models.Ticket.get({ id: ticketId });
  if (!ticket) {
    throw new Error(`Ticket ${ticketId} not found`);
  }

  const { departmentId } = ticket;

  // Fetch today's tickets for the department
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data: allTickets } = await client.models.Ticket.list({
    filter: {
      departmentId: { eq: departmentId },
      createdAt: {
        ge: startOfDay.toISOString(),
        le: endOfDay.toISOString(),
      },
    },
  });

  // Only reorder tickets that are still waiting
  const waitingTickets = (allTickets ?? [])
    .filter((t) => t.status === "WAITING")
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  if (waitingTickets.length === 0) {
    throw new Error(
      `No waiting tickets found for department ${departmentId} today`,
    );
  }

  // Remove the target ticket and re-insert at the requested 1-based position
  const others = waitingTickets.filter((t) => t.id !== ticketId);
  const clamped = Math.min(Math.max(1, newPosition), waitingTickets.length);
  others.splice(clamped - 1, 0, ticket);

  // Write updated positions for every waiting ticket
  for (let i = 0; i < others.length; i++) {
    await client.models.Ticket.update({
      id: others[i].id,
      position: i + 1,
    });
  }

  // Recalculate wait times using calculateDepartmentQueue
  await client.mutations.calculateDepartmentQueue({ departmentId });

  return true;
};
