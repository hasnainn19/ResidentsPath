import { data, type Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";
import { GraphQLAPI, graphqlOperation } from '@aws-amplify/api-graphql';
import { Amplify } from 'aws-amplify'

import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/checkTicketNumber'; 
import { getAmplifyClient } from "../utils/amplifyClient";

// const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

// Amplify.configure(resourceConfig, libraryOptions);

// const client = generateClient<Schema>();


/**
 * Lambda function to check if a ticket number exists in the database
 *
 * This is a public-facing query that allows residents to check
 * their ticket status without authentication. It returns only safe, non-sensitive
 * fields to prevent exposing internal IDs or private case information.
 *
 * @param event.arguments.ticketNumber - The ticket number to look up
 * @returns 
 */
export const handler: Schema["checkTicketNumber"]["functionHandler"] = async (event) => {
    const client = await getAmplifyClient();

    const { ticketNumber } = event.arguments;



    // Query tickets by ticket number
    const { data: tickets } = await client.models.Ticket.list({
        filter: { ticketNumber: { eq: ticketNumber } },
    });

    if (!tickets || tickets.length === 0) {
        return null
    }

    // Ticket numbers should be unique, so we take the first match
    const ticket = tickets[0];

    // Return only safe, public fields
    return {
        caseId: ticket.caseId,
        ticketNumber: ticket.ticketNumber,
    };
};