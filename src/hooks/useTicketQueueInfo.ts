import { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import { getDataAuthMode } from '../utils/getDataAuthMode';

/**
 * Fetches and polls queue information for a given case's active ticket.
 *
 * Calls getTicketInfo on mount and then every 60 seconds to keep the
 * queue position and estimated wait times up to date. Polling is preferred
 * over a live subscription here to avoid frequent UI flickering as ticket
 * positions shift.
 *
 * @param caseId - The case ID to fetch ticket queue info for. If undefined,
 *                 no fetch is performed.
 * @returns position, waitTimeLower, waitTimeUpper, error, and isLoading
 */
export function useTicketQueueInfo(caseId: string | undefined) {
    const [position, setPosition] = useState(0);
    const [waitTimeLower, setWaitTimeLower] = useState(0);
    const [waitTimeUpper, setWaitTimeUpper] = useState(0);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const client = useMemo(() => generateClient<Schema>(), []);

    async function fetch() {
        if (!caseId) return;

        try {
            const authMode = await getDataAuthMode();
            const { data: ticketInfo, errors: ticketErrors } = await client.queries.getTicketInfo(
                { caseId },
                { authMode },
            );

            if (ticketErrors && ticketErrors.length > 0) {
                setError(ticketErrors[0].message);
                return;
            }
            if (!ticketInfo) return;

            setPosition(ticketInfo.position);
            setWaitTimeLower(ticketInfo.estimatedWaitTimeLower);
            setWaitTimeUpper(ticketInfo.estimatedWaitTimeUpper);
        }
        catch (err) {
            setError(`Failed to fetch tickets: ${err}`);
        }
        finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetch();
        const interval = setInterval(fetch, 60000);
        return () => clearInterval(interval);
    }, [caseId]);

    return { position, waitTimeLower, waitTimeUpper, error, isLoading };
}
