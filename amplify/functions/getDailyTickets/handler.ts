// lambda/getDailyTickets.ts
import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";

export const handler: Schema["getDailyTickets"]["functionHandler"] = async () => {
    const client = generateClient<Schema>({
        authMode: "identityPool",
    });

    const now = new Date();

    // Get start and end of today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0); // 00:00:00
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999); // 23:59:59

    const { data: tickets } = await client.models.Ticket.list({
        filter: {
            createdAt: {
                between: [startOfDay.toISOString(), endOfDay.toISOString()],
            },
        },
    });

    if (!tickets || tickets.length === 0) {
        return [];
    }

    // Return only safe fields
    return tickets.map(ticket => ({
        caseId: ticket.caseId,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status as string,
        placement: ticket.placement,
        estimatedWaitTimeLower: ticket.estimatedWaitTimeLower,
        estimatedWaitTimeUpper: ticket.estimatedWaitTimeUpper,
        createdAt: ticket.createdAt,
    }));
};