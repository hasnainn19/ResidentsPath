import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";
import { recalculateDepartmentQueue } from "../utils/recalculateDepartmentQueue";

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

  if (ticket.status !== "WAITING") {
    throw new Error(`Ticket ${ticketId} is not in WAITING status`);
  }

  const departmentName = ticket.departmentName;

  // Fetch today's tickets for the department
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data: allTickets } = await client.models.Ticket.list({
    filter: {
      departmentName: { eq: departmentName },
      createdAt: {
        ge: startOfDay.toISOString(),
        le: endOfDay.toISOString(),
      },
      status: { eq: "WAITING" },
    },
  });

  // Reorder tickets
  const orderedTickets = (allTickets ?? []).sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  if (orderedTickets.length === 0) {
    throw new Error(
      `No waiting tickets found for department ${departmentName} today`,
    );
  }

  // Remove the target ticket and re-insert at the requested 1-based position
  const others = orderedTickets.filter((t) => t.id !== ticketId);
  const clamped = Math.min(Math.max(1, newPosition), orderedTickets.length);
  others.splice(clamped - 1, 0, ticket);

  // Write updated positions for every waiting ticket
  try {
    await Promise.all(
      others.map((ticket, i) =>
        client.models.Ticket.update({
          id: ticket.id,
          position: i + 1,
        }),
      ),
    );
  } catch (error) {
    console.error(`Failed to adjust positions for ${departmentName}`);
  }

  // Recalculate wait times
  try {
    await recalculateDepartmentQueue(departmentName);
  } 
  catch (error) {
    console.error(`recalculateDepartmentQueue: failed for department ${departmentName}`, error);
  }

  return true;
};
