import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";
import { DepartmentLabelById } from "../../../shared/formSchema";
import {
  createFoundErrorResponse,
  getCaseAccessErrorMessage,
  loadAccessibleCaseByReference,
} from "../utils/caseAccess";

const client = await getAmplifyClient();
const RECEIPT_ACCESS_MESSAGES = {
  notFound: "We could not find a receipt for that case reference number.",
  accessDenied:
    "We could not find a receipt for that case reference number. If this receipt is linked to your account, please log in and try again.",
  loadFailed: "We could not load that receipt right now.",
} as const;

// Sorts items by createdAt descending and returns the latest item
function getLatestByCreatedAt<T extends { createdAt?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.createdAt ?? "");
    const bTime = Date.parse(b.createdAt ?? "");
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  })[0];
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
    return createFoundErrorResponse("We could not load that receipt right now.");
  }

  const tickets = (ticketLookup.data ?? []).filter(Boolean);
  const appointments = (appointmentLookup.data ?? []).filter(Boolean);

  if (!tickets.length && !appointments.length) {
    return createFoundErrorResponse(
      "We could not find receipt details for that case reference number.",
    );
  }

  // If there are multiple tickets or appointments (due to follow-ups), show the most recent one
  const latestTicket = getLatestByCreatedAt(tickets);
  const latestAppointment = getLatestByCreatedAt(appointments);

  return {
    found: true as const,
    ticket: latestTicket,
    appointment: latestAppointment,
  };
}

export const handler: Schema["getSubmissionReceipt"]["functionHandler"] = async (event) => {
  const referenceNumber = event.arguments.referenceNumber?.trim().toUpperCase() ?? "";

  const caseLookup = await loadAccessibleCaseByReference(
    client,
    event.identity,
    referenceNumber,
    "getSubmissionReceipt",
  );

  if ("reason" in caseLookup) {
    return createFoundErrorResponse(
      getCaseAccessErrorMessage(caseLookup.reason, RECEIPT_ACCESS_MESSAGES),
    );
  }

  const { caseRecord } = caseLookup;

  const receiptDetails = await getReceiptDetails(caseRecord.id);

  if (!receiptDetails.found) {
    return receiptDetails;
  }

  const { appointment, ticket } = receiptDetails;
  const ticketCreatedAtMs = Date.parse(ticket?.createdAt ?? "");
  const appointmentCreatedAtMs = Date.parse(appointment?.createdAt ?? "");
  const useAppointment =
    appointment &&
    (!ticket ||
      (Number.isFinite(appointmentCreatedAtMs) ? appointmentCreatedAtMs : 0) >=
        (Number.isFinite(ticketCreatedAtMs) ? ticketCreatedAtMs : 0));

  return {
    found: true,
    createdAt:
      (useAppointment ? appointment?.createdAt : ticket?.createdAt) ??
      caseRecord.createdAt ??
      undefined,
    referenceNumber: caseRecord.referenceNumber ?? referenceNumber,
    bookingReferenceNumber: useAppointment
      ? (appointment?.bookingReferenceNumber ?? undefined)
      : undefined,
    receiptType: useAppointment ? "APPOINTMENT" : "QUEUE",
    ticketNumber: useAppointment ? undefined : (ticket?.ticketNumber ?? undefined),
    appointmentDateIso: useAppointment ? (appointment?.date ?? undefined) : undefined,
    appointmentTime: useAppointment ? (appointment?.time ?? undefined) : undefined,
    departmentName: caseRecord.departmentId
      ? (DepartmentLabelById[caseRecord.departmentId as keyof typeof DepartmentLabelById] ??
        undefined)
      : undefined,
  };
};
