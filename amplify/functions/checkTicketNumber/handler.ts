import { type Schema } from "../../data/resource";

import { getAmplifyClient } from "../utils/amplifyClient";


/**
 * Lambda function to check if a ticket number exists in the database
 *
 * This is a public-facing query that allows residents to check
 * their ticket status without authentication. It returns only safe, non-sensitive
 * fields to prevent exposing internal IDs or private case information.
 *
 * @param event.arguments.ticketNumber - The ticket number to look up
 * @returns Object containing case id of the ticket
 */
export const handler: Schema["checkTicketNumber"]["functionHandler"] = async (event) => {
    const client = await getAmplifyClient();

    const { ticketNumber } = event.arguments;

    const { data: tickets } = await client.models.Ticket.listTicketByTicketNumber({
        ticketNumber
    });

    if (!tickets?.length) {
    throw new Error(`No ticket found with ticketNumber ${ticketNumber}`);
    }

    const ticket = tickets[0];

    return {
        caseId: ticket.caseId,
    };
};