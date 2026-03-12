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

    const checkTicketNo = async (ticketNo: string) => {
        try {
            const { data: ticketData, errors: ticketErrors } = await client.queries.checkTicketNumber({ ticketNumber: ticketNo });
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
    }
        
    const checkRefNo = async (refNo: string, type?: "QUEUE" | "APPOINTMENT") => {
        if (isChecking) { // guard against multiple clicks
            return;
        }

        setFoundCaseId('');
        setRefNoError('');
        setIsChecking(true);

        if (type === "QUEUE") {
            await checkTicketNo(refNo);
        }

        // check booking ref

        else if (isTicketReference(refNo)) {
            await checkTicketNo(refNo);
        } 
        else { 
            setIsChecking(false);
            setRefNoError(`${refNo} is invalid`);
        }
    }
    return { foundCaseId, refNoError, checkRefNo, isChecking }
}