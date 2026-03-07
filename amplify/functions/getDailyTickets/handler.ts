// lambda/getDailyTickets.ts
import { data, type Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";
import { GraphQLAPI, graphqlOperation } from '@aws-amplify/api-graphql';
import { Amplify } from 'aws-amplify'

import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/getDailyTickets'; 

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: Schema["getDailyTickets"]["functionHandler"] = async () => {
    const now = new Date();

    // Get start and end of today
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0); // 00:00:00
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999); // 23:59:59

    const { data: tickets } = await client.models.Ticket.list({
        filter: {
            // createdAt: {
            //     between: [startOfDay.toISOString(), endOfDay.toISOString()],
            // },
        },
    });

    if (!tickets || tickets.length === 0) {
        console.error("There are no tickets");
        return null;
    }


    return tickets.map(ticket => ({
        caseId: ticket.caseId,
        departmentName:ticket.departmentName,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status as string,
        placement: ticket.placement,
        estimatedWaitTimeLower: ticket.estimatedWaitTimeLower,
        estimatedWaitTimeUpper: ticket.estimatedWaitTimeUpper,
        createdAt: ticket.createdAt,
    }));
};