import type { Schema } from "../../data/resource";

import { getAmplifyClient } from "../utils/amplifyClient";

export const handler: Schema["getCaseDetails"]["functionHandler"] = async (
  event,
) => {
  // Initialize Amplify client with admin permissions
  const client = await getAmplifyClient();
  const caseId = event.arguments.caseId;
  if (!caseId) {
    console.error("caseId required");
    throw Error(`caseId required`);
  }

  const { data: selectedCase } = await client.models.Case.get({
    id: caseId,
  });
  if (!selectedCase) {
    console.error(`Failed to find case with caseId ${caseId}`);
    throw Error(`Failed to find case with caseId ${caseId}`);
  }

  const { data: selectedTickets } =
    await client.models.Ticket.listTicketByCaseId({
      caseId: caseId,
    });

  const { data: user } = await client.models.User.get({
    id: selectedCase?.userId,
  });
  if (!user) {
    console.error("No user found");
  }
  const tickets = (selectedTickets ?? []).map((t) => ({
    ticketId: t.id ?? null,
    ticketStatus: (t.status as string) ?? null,
  }));

  // The Amplify-generated RefType for nested custom types is not assignable
  // from plain objects, so we cast to satisfy the function handler signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    caseName: selectedCase?.name,
    referenceNumber: selectedCase.referenceNumber,
    departmentId: selectedCase?.departmentId,
    description: selectedCase?.description,
    status: selectedCase?.status as string,
    priority: selectedCase?.priority,
    flag: selectedCase?.flag,
    notes: selectedCase?.notes,
    enquiry: selectedCase?.enquiry,
    childrenCount: selectedCase?.childrenCount,
    householdSize: selectedCase?.householdSize,
    ageRange: selectedCase?.ageRange,
    hasDisabilityOrSensory: selectedCase?.hasDisabilityOrSensory,
    disabilityType: selectedCase?.disabilityType,
    domesticAbuse: selectedCase?.domesticAbuse,
    safeToContact: selectedCase?.safeToContact,
    safeContactNotes: selectedCase?.safeContactNotes,
    urgent: selectedCase?.urgent,
    urgentReason: selectedCase?.urgentReason,
    urgentReasonOtherText: selectedCase?.urgentReasonOtherText,
    supportNotes: selectedCase?.supportNotes,
    supportNeeds: selectedCase?.supportNeedsJson,
    otherSupport: selectedCase?.otherSupport,
    additionalInfo: selectedCase?.additionalInfo,
    residentName: user?.firstName?.concat(" ", user?.lastName ?? ""),
    tickets: tickets as any,
  };
};
