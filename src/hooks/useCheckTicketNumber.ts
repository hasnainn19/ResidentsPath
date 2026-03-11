import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

export const useCheckTicketNumber = () => {
    const client = generateClient<Schema>({ authMode: "userPool" });
    const [ foundCaseId, setFoundCaseId ] = useState('');
    const [ ticketNoError, setTicketNoError ] = useState('');
    const [ isChecking, setIsChecking ] = useState(false);
        
    const checkTicket = async (refNo: string) => {
        if (isChecking) { // guard against multiple clicks
            return;
        }

        setFoundCaseId('');
        setTicketNoError('');
        setIsChecking(true);

        try {
            const { data: ticketData, errors: ticketErrors } = await client.queries.checkTicketNumber({ ticketNumber: refNo });
            if (ticketErrors && ticketErrors.length > 0) {
                setTicketNoError(ticketErrors[0].message);
                return;
            }
            if (!ticketData) {
                setTicketNoError("No ticket found");
                return;
            }
            const id = ticketData.caseId;
            setFoundCaseId(id);
        } catch(errors){
            setTicketNoError(`Failed to fetch ticket: ${errors}`);
            return;
        } finally {
            setIsChecking(false); // always reset
        }
    }
    return { foundCaseId, ticketNoError, checkTicket, isChecking }
}