import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const TICKET_PREFIXES = ["CH", "CT", "H", "A", "C", "G"] as const;

// checks if reference number starts with the ticket prefix
function isTicketReference(ref: string): boolean {
  for (const prefix of TICKET_PREFIXES) {
    if (ref.startsWith(prefix)) {
      const rest = ref.slice(prefix.length); 
      if (/^\d{3}$/.test(rest)) {           
        return true;
      }
    }
  }
  return false;
}

export const useCheckReferenceNumber = () => {
    const client = generateClient<Schema>({ authMode: "userPool" });
    const [ foundCaseId, setFoundCaseId ] = useState('');
    const [ refNoError, setRefNoError ] = useState('');
    const [ isChecking, setIsChecking ] = useState(false);
        
    const checkRefNo = async (refNo: string) => {
        if (isChecking) { // guard against multiple clicks
            return;
        }

        setFoundCaseId('');
        setRefNoError('');
        setIsChecking(true);

        if (isTicketReference(refNo)) {
            try {
                const { data: ticketData, errors: ticketErrors } = await client.queries.checkTicketNumber({ ticketNumber: refNo });
                if (ticketErrors && ticketErrors.length > 0) {
                    setRefNoError(ticketErrors[0].message);
                    return;
                }
                if (!ticketData) {
                    setRefNoError("No ticket found");
                    return;
                }
                const id = ticketData.caseId;
                setFoundCaseId(id);
            } catch(errors){
                setRefNoError(`Failed to fetch ticket: ${errors}`);
                return;
            } finally {
                setIsChecking(false); // always reset
            }
        } // else if check for booking ref
        else { // Handle when ticket number doesn't start with one of the prefixes
            setIsChecking(false);
            setRefNoError(`Ticket Number ${refNo} is invalid`);
        }
    }
    return { foundCaseId, refNoError, checkRefNo, isChecking }
}