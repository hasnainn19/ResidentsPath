import type { AmplifyClient } from "./amplifyClient";
import { getIdentitySub, isStaffIdentity } from "./identityGroups";
import { logModelErrors } from "./runCleanup";

type CaseLookupData =
  Awaited<ReturnType<AmplifyClient["models"]["Case"]["listCaseByReferenceNumber"]>>["data"];
type CaseRecord = NonNullable<CaseLookupData>[number];

type UserLookupData = Awaited<ReturnType<AmplifyClient["models"]["User"]["get"]>>["data"];
type UserRecord = NonNullable<UserLookupData>;

export const CASE_ACCESS_NOT_FOUND_MESSAGE = "We could not find a case with that reference number.";
export const CASE_ACCESS_ACCESS_DENIED_MESSAGE =
  "We could not find that case reference number. If this case is linked to your account, please log in and try again.";

export type CaseAccessFailureReason =
  | "CASE_LOOKUP_FAILED"
  | "CASE_NOT_FOUND"
  | "USER_LOOKUP_FAILED"
  | "USER_NOT_FOUND"
  | "REGISTERED_USER_ACCESS_DENIED"
  | "TICKET_LOOKUP_FAILED";

type AccessibleCaseByReferenceResult =
  | {
      caseRecord: CaseRecord;
      userRecord?: UserRecord;
    }
  | {
      reason:
        | "CASE_LOOKUP_FAILED"
        | "CASE_NOT_FOUND"
        | "USER_LOOKUP_FAILED"
        | "USER_NOT_FOUND"
        | "REGISTERED_USER_ACCESS_DENIED";
    };

type ActiveWaitingTicketResult =
  | {
      hasActiveWaitingTicket: boolean;
    }
  | {
      reason: "TICKET_LOOKUP_FAILED";
    };

type CaseLookupFailureReason = "CASE_LOOKUP_FAILED" | "CASE_NOT_FOUND";

type UserLookupFailureReason = "USER_LOOKUP_FAILED" | "USER_NOT_FOUND";

export function createFoundErrorResponse(errorMessage: string) {
  return {
    found: false as const,
    errorMessage,
  };
}

export function getCaseAccessErrorMessage(
  reason: CaseAccessFailureReason,
  messages: {
    notFound: string;
    accessDenied: string;
    loadFailed: string;
  },
) {
  switch (reason) {
    case "CASE_NOT_FOUND":
    case "USER_NOT_FOUND":
      return messages.notFound;
    case "REGISTERED_USER_ACCESS_DENIED":
      return messages.accessDenied;
    case "CASE_LOOKUP_FAILED":
    case "USER_LOOKUP_FAILED":
    case "TICKET_LOOKUP_FAILED":
      return messages.loadFailed;
  }
}

export function isCaseAccessValidationFailure(reason: CaseAccessFailureReason) {
  return (
    reason === "CASE_NOT_FOUND" ||
    reason === "USER_NOT_FOUND" ||
    reason === "REGISTERED_USER_ACCESS_DENIED"
  );
}

async function findCaseByReference(
  client: AmplifyClient,
  referenceNumber: string,
  logPrefix: string,
): Promise<CaseRecord | CaseLookupFailureReason> {
  const normalisedReferenceNumber = referenceNumber.trim().toUpperCase();
  const caseLookup = await client.models.Case.listCaseByReferenceNumber({
    referenceNumber: normalisedReferenceNumber,
  });

  if (caseLookup.errors?.length) {
    logModelErrors(`${logPrefix}: Case.listCaseByReferenceNumber failed`, caseLookup.errors);
    return "CASE_LOOKUP_FAILED";
  }

  const caseRecord = caseLookup.data?.[0];

  if (!caseRecord?.id || !caseRecord.userId) {
    return "CASE_NOT_FOUND";
  }

  return caseRecord;
}

async function findUserById(
  client: AmplifyClient,
  userId: string,
  logPrefix: string,
): Promise<UserRecord | UserLookupFailureReason> {
  const userLookup = await client.models.User.get({
    id: userId,
  });

  if (userLookup.errors?.length) {
    logModelErrors(`${logPrefix}: User.get failed`, userLookup.errors);
    return "USER_LOOKUP_FAILED";
  }

  const userRecord = userLookup.data;

  if (!userRecord?.id) {
    return "USER_NOT_FOUND";
  }

  return userRecord;
}

// For registered users, ensure only they and staff can access cases linked to their account
function validateRegisteredUserAccess(
  identity: unknown,
  userRecord: UserRecord,
): "REGISTERED_USER_ACCESS_DENIED" | null {
  if (!userRecord.isRegistered || isStaffIdentity(identity)) {
    return null;
  }

  const sub = getIdentitySub(identity);

  if (!sub || sub !== userRecord.id) {
    return "REGISTERED_USER_ACCESS_DENIED";
  }

  return null;
}

export async function loadAccessibleCaseByReference(
  client: AmplifyClient,
  identity: unknown,
  referenceNumber: string,
  logPrefix: string,
): Promise<AccessibleCaseByReferenceResult> {
  const caseRecord = await findCaseByReference(client, referenceNumber, logPrefix);

  if (typeof caseRecord === "string") {
    return { reason: caseRecord as CaseLookupFailureReason };
  }

  if (isStaffIdentity(identity)) {
    return {
      caseRecord,
    };
  }

  const userRecord = await findUserById(client, caseRecord.userId, logPrefix);

  if (typeof userRecord === "string") {
    return { reason: userRecord as UserLookupFailureReason };
  }

  const accessFailureReason = validateRegisteredUserAccess(identity, userRecord);

  if (accessFailureReason) {
    return {
      reason: accessFailureReason,
    };
  }

  return {
    caseRecord,
    userRecord,
  };
}

export async function getHasActiveWaitingTicket(
  client: AmplifyClient,
  caseId: string,
  logPrefix: string,
): Promise<ActiveWaitingTicketResult> {
  const ticketLookup = await client.models.Ticket.listTicketByCaseId({
    caseId,
  });

  if (ticketLookup.errors?.length) {
    logModelErrors(`${logPrefix}: Ticket.listTicketByCaseId failed`, ticketLookup.errors);
    return {
      reason: "TICKET_LOOKUP_FAILED",
    };
  }

  const hasActiveWaitingTicket = (ticketLookup.data ?? []).some(
    (ticket) => ticket?.status === "WAITING",
  );

  return {
    hasActiveWaitingTicket,
  };
}
