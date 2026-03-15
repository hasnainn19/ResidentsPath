import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";
import { DepartmentLabelById } from "../../../shared/formSchema";

const client = await getAmplifyClient();

function errorResponse(errorMessage: string) {
  return {
    found: false as const,
    errorMessage,
  };
}

async function getCase(referenceNumber: string) {
  const caseLookup = await client.models.Case.listCaseByReferenceNumber({
    referenceNumber,
  });

  if (caseLookup.errors?.length) {
    console.error("getSubmissionReceipt: case lookup failed", caseLookup.errors);
    return errorResponse("We could not load that receipt right now.");
  }

  const caseRecord = caseLookup.data?.[0];

  if (!caseRecord?.id || !caseRecord.userId) {
    return errorResponse("We could not find a receipt for that case reference.");
  }

  return {
    found: true as const,
    caseRecord,
  };
}

async function getUser(userId: string) {
  const userLookup = await client.models.User.get({
    id: userId,
  });

  if (userLookup.errors?.length) {
    console.error("getSubmissionReceipt: user lookup failed", userLookup.errors);
    return errorResponse("We could not load that receipt right now.");
  }

  const userRecord = userLookup.data;

  if (!userRecord?.id) {
    return errorResponse("We could not find a receipt for that case reference.");
  }

  return {
    found: true as const,
    userRecord,
  };
}

function validateRegisteredUserAccess(
  sub: string | null,
  userRecord: { id: string; isRegistered?: boolean | null },
) {
  // If the user is registered, require that the user is logged in and is the owner of the receipt
  if (!userRecord.isRegistered) {
    return null;
  }

  if (!sub || sub !== userRecord.id) {
    return errorResponse(
      "We could not find a receipt for that case reference. If this receipt is linked to your account, please log in and try again.",
    );
  }

  return null;
}

async function getReceiptDetails(caseId: string) {
  const [ticketLookup, appointmentLookup] = await Promise.all([
    client.models.Ticket.listTicketByCaseId({
      caseId,
    }),
    client.models.Appointment.listAppointmentByCaseId({
      caseId,
    }),
  ]);

  if (ticketLookup.errors?.length || appointmentLookup.errors?.length) {
    console.error("getSubmissionReceipt: receipt lookup failed", {
      ticketErrors: ticketLookup.errors,
      appointmentErrors: appointmentLookup.errors,
    });
    return errorResponse("We could not load that receipt right now.");
  }

  const ticket = ticketLookup.data?.[0];
  const appointment = appointmentLookup.data?.[0];

  if (!ticket && !appointment) {
    return errorResponse("We could not find receipt details for that case reference.");
  }

  return {
    found: true as const,
    ticket,
    appointment,
  };
}

export const handler: Schema["getSubmissionReceipt"]["functionHandler"] = async (event) => {
  const referenceNumber = event.arguments.referenceNumber?.trim().toUpperCase() ?? "";

  const caseLookup = await getCase(referenceNumber);

  if (!caseLookup.found) {
    return caseLookup;
  }

  const { caseRecord } = caseLookup;
  const userLookup = await getUser(caseRecord.userId);

  if (!userLookup.found) {
    return userLookup;
  }

  const { userRecord } = userLookup;

  const sub =
    event.identity && typeof event.identity === "object" && "sub" in event.identity
      ? (event.identity.sub as string)
      : null;
  const accessError = validateRegisteredUserAccess(sub, userRecord);

  if (accessError) {
    return accessError;
  }

  const receiptDetails = await getReceiptDetails(caseRecord.id);

  if (!receiptDetails.found) {
    return receiptDetails;
  }

  const { appointment, ticket } = receiptDetails;

  return {
    found: true,
    createdAt: caseRecord.createdAt ?? undefined,
    referenceNumber: caseRecord.referenceNumber ?? referenceNumber,
    bookingReferenceNumber: appointment?.bookingReferenceNumber ?? undefined,
    receiptType: appointment ? "APPOINTMENT" : "QUEUE",
    ticketNumber: ticket?.ticketNumber ?? undefined,
    appointmentDateIso: appointment?.date ?? undefined,
    appointmentTime: appointment?.time ?? undefined,
    departmentName: caseRecord.departmentId
      ? DepartmentLabelById[caseRecord.departmentId as keyof typeof DepartmentLabelById] ?? undefined
      : undefined,
  };
};
