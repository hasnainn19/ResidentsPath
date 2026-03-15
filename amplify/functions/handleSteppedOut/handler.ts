import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

export const handler: Schema["handleSteppedOut"]["functionHandler"] = async (event) => {
    const { ticketId, caseId, steppedOut } = event.arguments;

    if (!ticketId) {
        throw new Error("handleSteppedOut: Missing ticketId");
    }

    if (!caseId) {
        throw new Error("handleSteppedOut: Missing caseId");
    }

    const client = await getAmplifyClient();

    const { data: existingTicket } = await client.models.Ticket.get({ id: ticketId });

    if (!existingTicket) {
        throw new Error(`handleSteppedOut: Ticket with ID ${ticketId} not found`);
    }

    if (existingTicket.caseId !== caseId) {
        throw new Error("handleSteppedOut: Not authorized to modify this ticket");
    }

    const { data: ticket } = await client.models.Ticket.update({
        id: ticketId,
        steppedOut,
    });

    if (!ticket) {
        throw new Error(`handleSteppedOut: Failed to update ticket ${ticketId}`);
    }

    return { success: true };
};