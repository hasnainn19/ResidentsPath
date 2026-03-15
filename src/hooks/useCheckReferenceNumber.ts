import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { DepartmentCodeById } from "../../shared/departmentCodes";
import { getDataAuthMode } from "../utils/getDataAuthMode";
import {
  isBookingReferenceNumber,
  normaliseReferenceNumber,
} from "../../shared/referenceNumbers";

const TICKET_PREFIXES = Object.values(DepartmentCodeById);

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
    const client = generateClient<Schema>();
    const [ foundCaseId, setFoundCaseId ] = useState('');
    const [ appointmentReferenceNumber, setAppointmentReferenceNumber ] = useState('');
    const [ refNoError, setRefNoError ] = useState('');
    const [ isChecking, setIsChecking ] = useState(false);

    const checkTicketNo = async (ticketNo: string) => {
        try {
            const authMode = await getDataAuthMode();
            const { data: ticketData, errors: ticketErrors } = await client.queries.checkTicketNumber(
                { ticketNumber: ticketNo },
                { authMode },
            );
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

    const clearAppointmentReference = () => {
        setAppointmentReferenceNumber('');
    }
        
    const checkRefNo = async (refNo: string, type?: "QUEUE" | "APPOINTMENT") => {
        if (isChecking) { // guard against multiple clicks
            return;
        }

        const normalisedReference = normaliseReferenceNumber(refNo);

        setFoundCaseId('');
        setAppointmentReferenceNumber('');
        setRefNoError('');

        if (!normalisedReference) {
            setRefNoError("Enter a reference number.");
            return;
        }

        setIsChecking(true);

        if (type === "APPOINTMENT") {
            if (isBookingReferenceNumber(normalisedReference)) {
                setAppointmentReferenceNumber(normalisedReference);
            } else {
                setRefNoError(`${refNo} is invalid`);
            }

            setIsChecking(false);
            return;
        }

        if (type === "QUEUE") {
            await checkTicketNo(normalisedReference);
            return;
        }

        if (isBookingReferenceNumber(normalisedReference)) {
            setAppointmentReferenceNumber(normalisedReference);
            setIsChecking(false);
            return;
        }

        if (isTicketReference(normalisedReference)) {
            await checkTicketNo(normalisedReference);
            return;
        } 
        
        setIsChecking(false);
        setRefNoError(`${refNo} is invalid`);
    }
    return {
        foundCaseId,
        appointmentReferenceNumber,
        clearAppointmentReference,
        refNoError,
        checkRefNo,
        isChecking,
    }
}
