import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";
import { DepartmentLabelById } from "../../../shared/formSchema";

function errorResponse(errorMessage: string) {
  return {
    found: false as const,
    errorMessage,
  };
}

export const handler: Schema["getSubmissionReceipt"]["functionHandler"] = async (event) => {
  const rawReferenceNumber = event.arguments.referenceNumber;

  if (!rawReferenceNumber) {
    return errorResponse("No case reference was provided.");
  }

  const referenceNumber = rawReferenceNumber.trim().toUpperCase();

  if (!referenceNumber) {
    return errorResponse("No case reference was provided.");
  }

  const client = await getAmplifyClient();
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

  const userLookup = await client.models.User.get({
    id: caseRecord.userId,
  });

  if (userLookup.errors?.length) {
    console.error("getSubmissionReceipt: user lookup failed", userLookup.errors);
    return errorResponse("We could not load that receipt right now.");
  }

  const userRecord = userLookup.data;

  if (!userRecord?.id) {
    return errorResponse("We could not find a receipt for that case reference.");
  }

  // If the user is registered, require that the user is logged in and is the owner of the receipt
  if (userRecord.isRegistered) {
    const identity = event.identity;
    const sub =
      identity && typeof identity === "object" && "sub" in identity ? (identity.sub as string) : null;

    if (!sub || sub !== userRecord.id) {
      return errorResponse(
        "We could not find a receipt for that case reference. If this receipt is linked to your account, please log in and try again.",
      );
    }
  }

  const [ticketLookup, appointmentLookup] = await Promise.all([
    client.models.Ticket.listTicketByCaseId({
      caseId: caseRecord.id,
    }),
    client.models.Appointment.listAppointmentByCaseId({
      caseId: caseRecord.id,
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
    found: true,
    createdAt: caseRecord.createdAt ?? undefined,
    referenceNumber: caseRecord.referenceNumber ?? referenceNumber,
    receiptType: appointment ? "APPOINTMENT" : "QUEUE",
    ticketNumber: ticket?.ticketNumber ?? undefined,
    appointmentDateIso: appointment?.date ?? undefined,
    appointmentTime: appointment?.time ?? undefined,
    departmentName: caseRecord.departmentId
      ? DepartmentLabelById[caseRecord.departmentId as keyof typeof DepartmentLabelById] ?? undefined
      : undefined,
  };
};
