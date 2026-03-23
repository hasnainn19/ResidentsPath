import type { ScheduledHandler } from "aws-lambda";
import { getAmplifyClient, type AmplifyClient } from "../utils/amplifyClient";
import { createQueueSubmission } from "../utils/submissionShared";

type SeedDepartmentName =
  | "Homelessness"
  | "Adults_Duty"
  | "General_Customer_Services"
  | "Council_Tax_Or_Housing_Benefit"
  | "Childrens_Duty"
  | "Community_Hub_Advisor";

const SEED_CASES: { caseId: string; departmentName: SeedDepartmentName }[] = [
  // Homelessness
  { caseId: "4a349e14-540f-4eb9-96d3-6672dc28d679", departmentName: "Homelessness" },
  { caseId: "096c182d-84b6-4068-84de-8522667a588d", departmentName: "Homelessness" },
  { caseId: "f92f75ae-9c9b-4869-8fa0-f4016380793b", departmentName: "Homelessness" },
  { caseId: "dd3c89be-6604-4915-92dc-4a56e6d7c315", departmentName: "Homelessness" },
  // Adults_Duty
  { caseId: "ab630af3-00a7-43bb-bedf-53e87335a71a", departmentName: "Adults_Duty" },
  { caseId: "2e6f3c3e-2418-4370-b8e4-aacff490b6d6", departmentName: "Adults_Duty" },
  { caseId: "62fbb0f9-ef45-4085-938b-8993568f6956", departmentName: "Adults_Duty" },
  // General_Customer_Services
  { caseId: "558a38f3-2c7f-4c8b-8540-c541495cced1", departmentName: "General_Customer_Services" },
  { caseId: "9bcaa026-c8f1-4bef-bb17-09a3fb927aae", departmentName: "General_Customer_Services" },
  { caseId: "99ac13a7-61fc-47b3-b4e3-0f090ae7868d", departmentName: "General_Customer_Services" },
  // Council_Tax_Or_Housing_Benefit
  { caseId: "68cac95e-e4c2-423b-b13b-065711c792f7", departmentName: "Council_Tax_Or_Housing_Benefit" },
  { caseId: "f90d4f70-173a-4069-aa68-c579bbe3f21c", departmentName: "Council_Tax_Or_Housing_Benefit" },
  { caseId: "2f1e5af4-2814-4d16-b72f-512c190edb9b", departmentName: "Council_Tax_Or_Housing_Benefit" },
  // Childrens_Duty
  { caseId: "e11e01a0-5ec8-4009-9b1d-330e871bd611", departmentName: "Childrens_Duty" },
  { caseId: "4d38ed4a-8e6c-4c09-b924-2195549b3951", departmentName: "Childrens_Duty" },
  // Community_Hub_Advisor
  { caseId: "6a1a7d65-41f0-41f0-b42a-dd5cb1cf3a56", departmentName: "Community_Hub_Advisor" },
  { caseId: "f13c4966-0f50-4e9e-950e-7a1584ed1135", departmentName: "Community_Hub_Advisor" },
  { caseId: "c9060353-4033-4c55-bb5f-7eef87fb95de", departmentName: "Community_Hub_Advisor" },
];

/**
 * Runs every day at midnight UTC via EventBridge, on the main (production) deployment only —
 * as that is where the seeded cases exist.
 */
export const handler: ScheduledHandler = async () => {
  const client = await getAmplifyClient();

  const results = await Promise.allSettled(
    SEED_CASES.map(({ caseId, departmentName }) => seedCase(client, caseId, departmentName)),
  );

  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    console.error(
      `dailySeedQueue: ${failures.length} of ${SEED_CASES.length} seedCase operations failed`,
      failures,
    );
    throw new Error(`dailySeedQueue: ${failures.length} seedCase operations failed`);
  }
};

/**
 * Clears all WAITING tickets for the seeded cases and creates one fresh ticket per case,
 * skipping any case that has been RESOLVED or CLOSED.
 */
async function seedCase(
  client: AmplifyClient,
  caseId: string,
  departmentName: SeedDepartmentName,
): Promise<void> {
  const logPrefix = `dailySeedQueue [${departmentName}]`;

  const { data: caseRecord, errors: caseErrors } = await client.models.Case.get({ id: caseId });

  if (caseErrors?.length || !caseRecord) {
    console.error(`${logPrefix}: Failed to fetch case ${caseId}`, caseErrors);
    return;
  }

  if (caseRecord.status === "RESOLVED" || caseRecord.status === "CLOSED") {
    console.log(`${logPrefix}: Skipping case ${caseId} with status ${caseRecord.status}`);
    return;
  }

  const { data: tickets, errors: ticketErrors } = await client.models.Ticket.listTicketByCaseId({ caseId });

  if (ticketErrors?.length) {
    console.error(`${logPrefix}: Failed to list tickets for case ${caseId}`, ticketErrors);
    return;
  }

  const waitingTickets = (tickets ?? []).filter((t) => t.status === "WAITING");

  await Promise.allSettled(
    waitingTickets.map(async (ticket) => {
      try {
        const { errors: deleteErrors } = await client.models.Ticket.delete({ id: ticket.id });
        if (deleteErrors?.length) {
          console.error(`${logPrefix}: Failed to delete ticket ${ticket.id}`, deleteErrors);
        } 
        else {
          console.log(`${logPrefix}: Deleted WAITING ticket ${ticket.id}`);
        }
      } 
      catch (error) {
        console.error(`${logPrefix}: Error while deleting ticket ${ticket.id}`, error);
      }
    }),
  );

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
  try {
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
  catch (error) {
    console.error(`${logPrefix}: Unexpected error while creating ticket for case ${caseId}`, error);
  }
}
