import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";

/**
 * Lambda function to get ticket status by ticket number.
 *
 * This is a public-facing query that allows residents to check
 * their ticket status without authentication. It returns only safe, non-sensitive
 * fields to prevent exposing internal IDs or private case information.
 *
 * @param event.arguments.ticketNumber - The ticket number to look up
 * @returns Object containing ticketNumber, status, placement, and estimatedWaitTime, or null if not found
 */
export const handler: Schema["getTicketStatus"]["functionHandler"] = async (event) => {
    const { ticketNumber } = event.arguments;

    // Initialize Amplify client with admin permissions
    const client = generateClient<Schema>({
        authMode: "identityPool",
    });

    // Query tickets by ticket number
    const { data: tickets } = await client.models.Ticket.list({
        filter: { ticketNumber: { eq: ticketNumber } },
    });

    if (!tickets || tickets.length === 0) {
        return null;
    }

    // Ticket numbers should be unique, so we take the first match
    const ticket = tickets[0];

    // Return only safe, public fields
    return { 
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        placement: ticket.placement,
        estimatedWaitTime: ticket.estimatedWaitTime,
    };
};