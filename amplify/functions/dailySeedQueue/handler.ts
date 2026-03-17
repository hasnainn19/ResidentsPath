import type { ScheduledHandler } from "aws-lambda";
import { getAmplifyClient } from "../utils/amplifyClient";
import { createQueueSubmission } from "../utils/submissionShared";

const SEED_CASES: { caseId: string; departmentName: string }[] = [
  { caseId: "4a349e14-540f-4eb9-96d3-6672dc28d679", departmentName: "Homelessness" },
  { caseId: "ab630af3-00a7-43bb-bedf-53e87335a71a", departmentName: "Adults_Duty" },
  { caseId: "558a38f3-2c7f-4c8b-8540-c541495cced1", departmentName: "General_Customer_Services" },
  { caseId: "68cac95e-e4c2-423b-b13b-065711c792f7", departmentName: "Council_Tax_Or_Housing_Benefit" },
  { caseId: "e11e01a0-5ec8-4009-9b1d-330e871bd611", departmentName: "Childrens_Duty" },
  { caseId: "6a1a7d65-41f0-41f0-b42a-dd5cb1cf3a56", departmentName: "Community_Hub_Advisor" },
];

/**
 * Runs every day at midnight UTC via EventBridge, on the main (production) deployment only —
 * as that is where the seeded cases exist.
 * Clears all WAITING tickets for the seeded cases and creates one fresh ticket per case,
 * skipping any case that has been RESOLVED or CLOSED.
 */
export const handler: ScheduledHandler = async () => {
  const client = await getAmplifyClient();

  for (const { caseId, departmentName } of SEED_CASES) {
    const logPrefix = `dailySeedQueue [${departmentName}]`;

    // fetches the case and skips if RESOLVED or CLOSED
    const { data: caseRecord, errors: caseErrors } = await client.models.Case.get({ id: caseId });

    if (caseErrors?.length || !caseRecord) {
      console.error(`${logPrefix}: Failed to fetch case ${caseId}`, caseErrors);
      continue;
    }

    if (caseRecord.status === "RESOLVED" || caseRecord.status === "CLOSED") {
      console.log(`${logPrefix}: Skipping case ${caseId} with status ${caseRecord.status}`);
      continue;
    }

    // Clears old tickets by listing them by caseId, filters for WAITING, deletes them
    const { data: tickets, errors: ticketErrors } = await client.models.Ticket.listTicketByCaseId({ caseId });

    if (ticketErrors?.length) {
      console.error(`${logPrefix}: Failed to list tickets for case ${caseId}`, ticketErrors);
      continue;
    }

    const waitingTickets = (tickets ?? []).filter((t) => t.status === "WAITING");

    for (const ticket of waitingTickets) {
      const { errors: deleteErrors } = await client.models.Ticket.delete({ id: ticket.id });
      if (deleteErrors?.length) {
        console.error(`${logPrefix}: Failed to delete ticket ${ticket.id}`, deleteErrors);
      } 
      else {
        console.log(`${logPrefix}: Deleted WAITING ticket ${ticket.id}`);
      }
    }

    const visitState = {
      createdTicketId: null,
      claimedQueueId: null,
      claimedTicketDigits: null,
      claimedQueuePositionKey: null,
      createdAppointmentId: null,
      claimedAppointmentSlot: null,
      claimedBookingReferenceNumber: null,
    };

    /**
     * Creates a fresh ticket via createQueueSubmission which handles:
     * - Ticket number generation (e.g. H001) — resets naturally each day since the queue ID is date-based
     * - Queue position counter — also date-based, so starts fresh each day
     * - Estimated wait times from the Department record
     * Queue recalculation is handled automatically since the Ticket table DynamoDB stream fires on INSERT,
     * which triggers onTicketCompleted, which calls recalculateDepartmentQueue for the affected department
     */
    const result = await createQueueSubmission({
      client,
      caseId,
      departmentName,
      logPrefix,
      visitState,
    });

    if (!result.ok) {
      console.error(`${logPrefix}: Failed to create ticket — ${result.errorMessage}`);
    }
    else {
      console.log(`${logPrefix}: Created ticket ${result.ticketNumber} for case ${caseId}`);
    }
  }
};
