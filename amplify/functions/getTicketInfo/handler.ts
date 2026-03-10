import { type Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";


/**
 * Lambda function to fetch today's waiting ticket information for a case.
 *
 * This is a public-facing query that retrieves the current ticket for
 * a given case if it is in the "WAITING" status and was created today.
 * It returns the departmentId and the ticket's queue details, including
 * position and estimated wait time bounds.
 *
 * @param event.arguments.caseId - The ID of the case to look up
 * @throws Error if the caseId is missing, the case is not found, the case has no departmentId,
 *         or there is no waiting ticket for today
 * @returns Object containing:
 *   - departmentId: ID of the department handling the case
 *   - position: the current ticket's position in the queue
 *   - estimatedWaitTimeLower: lower bound of the estimated wait time in minutes
 *   - estimatedWaitTimeUpper: upper bound of the estimated wait time in minutes
 */

const client = await getAmplifyClient();

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
        throw new Error(`Tickets with caseId ${caseId} not found`);
    }

    // Filter out null tickets
    const validTickets = (tickets ?? []).filter(Boolean);

    if (!validTickets || validTickets.length === 0) {
        throw new Error(`No valid tickets with caseId ${caseId} found`);
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const currentTicket = validTickets.find(ticket => {
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
        position: currentTicket.position,
        estimatedWaitTimeLower: currentTicket.estimatedWaitTimeLower,
        estimatedWaitTimeUpper: currentTicket.estimatedWaitTimeUpper,
    };
};