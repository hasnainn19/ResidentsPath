import type { Schema } from "../../data/resource";
import {
  isValidCaseReferenceNumber,
  normaliseCaseReferenceNumber,
} from "../../../shared/formSchema";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  CASE_ACCESS_ACCESS_DENIED_MESSAGE,
  CASE_ACCESS_NOT_FOUND_MESSAGE,
  createFoundErrorResponse,
  getCaseAccessErrorMessage,
  getHasActiveWaitingTicket,
  loadAccessibleCaseByReference,
} from "../utils/caseAccess";
import {
  getCaseAppointmentCount,
  RESIDENT_CASE_APPOINTMENT_LIMIT,
} from "../utils/submissionShared";
import { isStaffIdentity } from "../utils/identityGroups";

const client = await getAmplifyClient();
const CASE_ACCESS_MESSAGES = {
  notFound: CASE_ACCESS_NOT_FOUND_MESSAGE,
  accessDenied: CASE_ACCESS_ACCESS_DENIED_MESSAGE,
  loadFailed: "We could not load that case right now.",
} as const;

export const handler: Schema["getCaseFollowUp"]["functionHandler"] = async (event) => {
  const referenceNumber = normaliseCaseReferenceNumber(event.arguments.referenceNumber);
  const isStaffUser = isStaffIdentity(event.identity);

  if (typeof referenceNumber !== "string") {
    return createFoundErrorResponse("Enter a case reference number.");
  }

  if (!isValidCaseReferenceNumber(referenceNumber)) {
    return createFoundErrorResponse("Enter a valid case reference number.");
  }

  const caseLookup = await loadAccessibleCaseByReference(
    client,
    event.identity,
    referenceNumber,
    "getCaseFollowUp",
  );

  if ("reason" in caseLookup) {
    return createFoundErrorResponse(
      getCaseAccessErrorMessage(caseLookup.reason, CASE_ACCESS_MESSAGES),
    );
  }

  const { caseRecord } = caseLookup;

  // Only open and in-progress cases can be updated online
  if (
    !caseRecord.departmentName ||
    (caseRecord.status !== "OPEN" && caseRecord.status !== "IN_PROGRESS")
  ) {
    return createFoundErrorResponse(
      "This case cannot be updated online right now. Please contact us if you still need help.",
    );
  }

  const waitingTicketLookup = await getHasActiveWaitingTicket(
    client,
    caseRecord.id,
    "getCaseFollowUp",
  );

  if ("reason" in waitingTicketLookup) {
    return createFoundErrorResponse(
      getCaseAccessErrorMessage(waitingTicketLookup.reason, CASE_ACCESS_MESSAGES),
    );
  }

  let hasReachedAppointmentLimit = false;

  if (!isStaffUser) {
    const appointmentCount = await getCaseAppointmentCount(
      client,
      caseRecord.id,
      "getCaseFollowUp",
    );

    if (appointmentCount === null) {
      return createFoundErrorResponse("We could not load that case right now.");
    }

    hasReachedAppointmentLimit = appointmentCount >= RESIDENT_CASE_APPOINTMENT_LIMIT;
  }

  const { departmentName, status } = caseRecord;

  return {
    found: true,
    referenceNumber: caseRecord.referenceNumber ?? referenceNumber,
    departmentName,
    status,
    hasActiveWaitingTicket: waitingTicketLookup.hasActiveWaitingTicket,
    hasReachedAppointmentLimit,
  };
};
