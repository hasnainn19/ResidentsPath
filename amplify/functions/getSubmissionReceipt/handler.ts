import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

export const handler: Schema["getSubmissionReceipt"]["functionHandler"] = async (event) => {
  const referenceNumber = event.arguments.referenceNumber.trim().toUpperCase();

  if (!referenceNumber) {
    return {
      found: false,
      errorMessage: "No case reference was provided.",
    };
  }

  const client = await getAmplifyClient();
  const caseLookup = await (client.models.Case as any).listCaseByReferenceNumber({
    referenceNumber,
    limit: 1,
  });

  if (caseLookup.errors?.length) {
    console.error("getSubmissionReceipt: case lookup failed", caseLookup.errors);
    return {
      found: false,
      errorMessage: "We could not load that receipt right now.",
    };
  }

  const caseRecord = caseLookup.data?.[0];

  if (!caseRecord?.id || !caseRecord.userId) {
    return {
      found: false,
      errorMessage: "We could not find a receipt for that case reference.",
    };
  }

  const userLookup = await client.models.User.get({
    id: caseRecord.userId,
  });

  if (userLookup.errors?.length) {
    console.error("getSubmissionReceipt: user lookup failed", userLookup.errors);
    return {
      found: false,
      errorMessage: "We could not load that receipt right now.",
    };
  }

  const userRecord = userLookup.data;

  if (!userRecord?.id) {
    return {
      found: false,
      errorMessage: "We could not find a receipt for that case reference.",
    };
  }

  // If the user is registered, require that the user is logged in and is the owner of the receipt
  if (userRecord.isRegistered) {
    const identity = event.identity;
    const sub =
      identity && typeof identity === "object" && "sub" in identity ? (identity.sub as string) : null;

    if (!sub || sub !== userRecord.id) {
      return {
        found: false,
        errorMessage:
          "We could not find a receipt for that case reference. If this receipt is linked to your account, please log in and try again.",
      };
    }
  }

  const [ticketLookup, appointmentLookup, departmentLookup] = await Promise.all([
    (client.models.Ticket as any).listTicketByCaseId({
      caseId: caseRecord.id,
      limit: 1,
    }),
    (client.models.Appointment as any).listAppointmentByCaseId({
      caseId: caseRecord.id,
      limit: 1,
    }),
    client.models.Department.get({ id: caseRecord.departmentId }),
  ]);

  if (ticketLookup.errors?.length || appointmentLookup.errors?.length) {
    console.error("getSubmissionReceipt: receipt lookup failed", {
      ticketErrors: ticketLookup.errors,
      appointmentErrors: appointmentLookup.errors,
    });
    return {
      found: false,
      errorMessage: "We could not load that receipt right now.",
    };
  }

  if (departmentLookup.errors?.length) {
    console.error("getSubmissionReceipt: department lookup failed", departmentLookup.errors);
  }

  const ticket = ticketLookup.data?.[0];
  const appointment = appointmentLookup.data?.[0];

  if (!ticket && !appointment) {
    return {
      found: false,
      errorMessage: "We could not find receipt details for that case reference.",
    };
  }

  return {
    found: true,
    createdAt: caseRecord.createdAt ?? undefined,
    referenceNumber: caseRecord.referenceNumber ?? referenceNumber,
    receiptType: appointment ? "APPOINTMENT" : "QUEUE",
    ticketNumber: ticket?.ticketNumber ?? undefined,
    appointmentDateIso: appointment?.date ?? undefined,
    appointmentTime: appointment?.time ?? undefined,
    departmentName: departmentLookup.data?.name ?? undefined,
  };
};