import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

export const handler: Schema["handleSteppedOut"]["functionHandler"] = async (event) => {
    const { ticketId, steppedOut } = event.arguments;

    if (!ticketId) {
        throw new Error("handleSteppedOut: Missing ticketId");
    }

    const client = await getAmplifyClient();

    const {data: ticket } = await client.models.Ticket.update({
        id: ticketId,
        steppedOut,
    });

    if (!ticket) {
        throw new Error(`handleSteppedOut: Ticket with ID ${ticketId} not found`);
    }

    return { success: true };
};