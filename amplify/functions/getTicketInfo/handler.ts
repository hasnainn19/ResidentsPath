import { data, type Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";
import { Amplify } from 'aws-amplify'

import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/getTicketInfo'; 

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: Schema["getTicketInfo"]["functionHandler"] = async (event) => {
    const { caseId } = event.arguments;

    if (!caseId) {
        throw new Error("caseId required");
    }

    // Get the case
    const { data: caseData } = await client.models.Case.get({
        id: caseId
    });

    if (!caseData) {
        throw new Error(`Case ${caseId} not found`);
    }

    // Get the departmentId
    const departmentId = caseData.departmentId;

    if (!departmentId) {
        throw new Error(`Case ${caseId} has no departmentId`);
    }

    // Get tickets for this case
    const { data: tickets } = await client.models.Ticket.list({
        filter: {
            caseId: { eq: caseId }
        }
    });

    if (!tickets || tickets.length === 0) {
        throw new Error(`Ticket with caseId ${caseId} not found`);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const currentTicket = tickets.find(ticket => {
        if (!ticket.createdAt) return false;

        const created = new Date(ticket.createdAt);

        return (
            ticket.status === "WAITING" &&
            created >= startOfDay &&
            created <= endOfDay
        );
    });

    if (!currentTicket) {
        throw new Error(`No waiting ticket for today for case ${caseId}`);
    }

    return {
        departmentId: departmentId,
        placement: currentTicket.placement,
        estimatedWaitTimeLower: currentTicket.estimatedWaitTimeLower,
        estimatedWaitTimeUpper: currentTicket.estimatedWaitTimeUpper,

    };
};