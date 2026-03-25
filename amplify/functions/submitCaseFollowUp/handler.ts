/**
 * This function handles the submission of a follow-up against an existing case.
 * It performs the following steps:
 * Validates and cleans the input data
 * Loads the existing case and checks the resident is allowed to continue it
 * Depending on the user's choice, it either books an appointment or creates a ticket for the case
 * Appends the new follow-up update to the case history
 *
 * The function returns the case reference number if successful
 */

import type { Schema } from "../../data/resource";
import { caseFollowUpSchema } from "../../../shared/formSchema";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  CASE_ACCESS_ACCESS_DENIED_MESSAGE,
  CASE_ACCESS_NOT_FOUND_MESSAGE,
  getCaseAccessErrorMessage,
  getHasActiveWaitingTicket,
  isCaseAccessValidationFailure,
  loadAccessibleCaseByReference,
} from "../utils/caseAccess";
import {
  createAppointmentSubmission,
  createQueueSubmission,
  cleanupCreatedVisitResources,
  createCaseUpdate,
  getCaseAppointmentCount,
  RESIDENT_CASE_APPOINTMENT_LIMIT,
  type CreatedVisitResourcesState,
} from "../utils/submissionShared";
import { isStaffIdentity } from "../utils/identityGroups";

type SubmitCaseFollowUpErrorCode = "VALIDATION" | "CAPACITY" | "CONFLICT" | "SERVER";

type SubmitCaseFollowUpResult = {
  ok: boolean;
  referenceNumber?: string;
  bookingReferenceNumber?: string;
  ticketNumber?: string;
  estimatedWaitTimeLower?: number;
  estimatedWaitTimeUpper?: number;
  errorCode?: SubmitCaseFollowUpErrorCode;
  errorMessage?: string;
};

const CASE_ACCESS_MESSAGES = {
  notFound: CASE_ACCESS_NOT_FOUND_MESSAGE,
  accessDenied: CASE_ACCESS_ACCESS_DENIED_MESSAGE,
  loadFailed: "Submission failed. Please try again.",
} as const;

function errorResult(
  errorCode: SubmitCaseFollowUpErrorCode,
  errorMessage: string,
): SubmitCaseFollowUpResult {
  return {
    ok: false,
    errorCode,
    errorMessage,
  };
}

export const handler: Schema["submitCaseFollowUp"]["functionHandler"] = async (event) => {
  const { input } = event.arguments;

  // Validate the input against the schema used for frontend and backend, ensuring it has the expected shape and types
  const parsed = caseFollowUpSchema.safeParse(input);
  if (!parsed.success) {
    console.warn("submitCaseFollowUp: validation failed", {
      issueCount: parsed.error.issues.length,
      firstIssue: parsed.error.issues[0]?.message,
    });

    return errorResult("VALIDATION", "Please check your answers and try again.");
  }

  const validated = parsed.data;
  const client = await getAmplifyClient();
  const isStaffUser = isStaffIdentity(event.identity);

  const caseLookup = await loadAccessibleCaseByReference(
    client,
    event.identity,
    validated.referenceNumber,
    "submitCaseFollowUp",
  );

  if ("reason" in caseLookup) {
    const errorCode = isCaseAccessValidationFailure(caseLookup.reason) ? "VALIDATION" : "SERVER";

    return errorResult(
      errorCode,
      getCaseAccessErrorMessage(caseLookup.reason, CASE_ACCESS_MESSAGES),
    );
  }

  const { caseRecord } = caseLookup;

  // Only open and in-progress cases can be updated online
  if (
    !caseRecord.departmentName ||
    (caseRecord.status !== "OPEN" && caseRecord.status !== "IN_PROGRESS")
  ) {
    return errorResult(
      "VALIDATION",
      "This case cannot be updated online right now. Please contact us if you still need help.",
    );
  }

  if (validated.proceed === "JOIN_DIGITAL_QUEUE") {
    const waitingTicketLookup = await getHasActiveWaitingTicket(
      client,
      caseRecord.id,
      "submitCaseFollowUp",
    );

    if ("reason" in waitingTicketLookup) {
      const errorCode = isCaseAccessValidationFailure(waitingTicketLookup.reason)
        ? "VALIDATION"
        : "SERVER";

      return errorResult(
        errorCode,
        getCaseAccessErrorMessage(waitingTicketLookup.reason, CASE_ACCESS_MESSAGES),
      );
    }

    if (waitingTicketLookup.hasActiveWaitingTicket) {
      return errorResult(
        "VALIDATION",
        "This case is already in the queue. Please wait for that visit to be completed before joining again.",
      );
    }
  }

  if (!isStaffUser && validated.proceed === "BOOK_APPOINTMENT") {
    const appointmentCount = await getCaseAppointmentCount(
      client,
      caseRecord.id,
      "submitCaseFollowUp",
    );

    if (appointmentCount === null) {
      return errorResult("SERVER", "Submission failed. Please try again.");
    }

    if (appointmentCount >= RESIDENT_CASE_APPOINTMENT_LIMIT) {
      return errorResult(
        "VALIDATION",
        "You can only book up to two appointments for this case online. Please contact us if you need another appointment.",
      );
    }
  }

  let createdCaseUpdateId: string | null = null;
  const createdVisitResources: CreatedVisitResourcesState = {
    createdTicketId: null,
    claimedQueueId: null,
    claimedTicketDigits: null,
    claimedQueuePositionKey: null,
    createdAppointmentId: null,
    claimedAppointmentSlot: null,
    claimedBookingReferenceNumber: null,
  };

  let ticketFailure: SubmitCaseFollowUpResult | null = null;
  let appointmentFailure: SubmitCaseFollowUpResult | null = null;
  let bookingReferenceNumber: string | undefined;
  let ticketNumber: string | undefined;
  let estimatedWaitTimeLower: number | undefined;
  let estimatedWaitTimeUpper: number | undefined;

  try {
    // If the user chose to book an appointment, create an appointment linked to the case
    if (validated.proceed === "BOOK_APPOINTMENT") {
      const appointmentResult = await createAppointmentSubmission({
        client,
        caseId: caseRecord.id,
        userId: caseRecord.userId,
        departmentName: caseRecord.departmentName,
        appointmentDateIso: validated.appointmentDateIso!,
        appointmentTime: validated.appointmentTime!,
        logPrefix: "submitCaseFollowUp",
        visitState: createdVisitResources,
      });

      if (!appointmentResult.ok) {
        appointmentFailure = errorResult(
          appointmentResult.errorCode,
          appointmentResult.errorMessage,
        );
        throw new Error("Appointment slot already claimed");
      }

      bookingReferenceNumber = appointmentResult.bookingReferenceNumber;
    } else {
      const queueResult = await createQueueSubmission({
        client,
        caseId: caseRecord.id,
        departmentName: caseRecord.departmentName,
        logPrefix: "submitCaseFollowUp",
        visitState: createdVisitResources,
      });

      if (!queueResult.ok) {
        ticketFailure = errorResult(queueResult.errorCode, queueResult.errorMessage);
        throw new Error("Ticket allocation failed");
      }

      ticketNumber = queueResult.ticketNumber;
      estimatedWaitTimeLower = queueResult.estimatedWaitTimeLower;
      estimatedWaitTimeUpper = queueResult.estimatedWaitTimeUpper;
    }

    if (validated.caseUpdate) {
      createdCaseUpdateId = await createCaseUpdate({
        client,
        caseId: caseRecord.id,
        content: validated.caseUpdate,
        logPrefix: "submitCaseFollowUp",
      });
    }

    return {
      ok: true,
      referenceNumber: caseRecord.referenceNumber ?? validated.referenceNumber,
      bookingReferenceNumber,
      ticketNumber,
      estimatedWaitTimeLower,
      estimatedWaitTimeUpper,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("submitCaseFollowUp: failed", {
      message,
      referenceNumber: validated.referenceNumber,
      createdCaseUpdateId: createdCaseUpdateId ?? undefined,
      createdAppointmentId: createdVisitResources.createdAppointmentId ?? undefined,
      createdTicketId: createdVisitResources.createdTicketId ?? undefined,
    });

    await cleanupCreatedVisitResources(client, createdVisitResources, "submitCaseFollowUp");

    if (ticketFailure) return ticketFailure;
    if (appointmentFailure) return appointmentFailure;

    return errorResult("SERVER", "Submission failed. Please try again.");
  }
};
