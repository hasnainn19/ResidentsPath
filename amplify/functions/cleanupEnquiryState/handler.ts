import type { DynamoDBRecord, DynamoDBStreamHandler } from "aws-lambda";
import { getAmplifyClient, type AmplifyClient } from "../utils/amplifyClient";
import { releaseAppointmentSlot } from "../utils/enquiriesStateTable";
import { logModelErrors, runCleanup, tryCleanup } from "../utils/runCleanup";
import {
  getRecordImages,
  getRecordTableName,
  getTableNames,
  listAllPages,
  releaseCaseReferenceClaim,
  releaseTicketClaims,
  type StreamItem,
} from "./helpers";

async function releaseAppointmentSlotForDetails(
  departmentName: string,
  dateIso: string,
  time: string,
) {
  await releaseAppointmentSlot({ departmentName, dateIso, time });
}

async function releaseAppointmentSlotForAppointmentRecord(
  client: AmplifyClient,
  appointment: StreamItem,
) {
  if (
    typeof appointment.caseId !== "string" ||
    typeof appointment.date !== "string" ||
    typeof appointment.time !== "string"
  ) {
    return;
  }

  const caseId = appointment.caseId;
  const date = appointment.date;
  const time = appointment.time;

  const { data: caseData, errors } = await client.models.Case.get({ id: caseId });
  logModelErrors("cleanupEnquiryState: Case.get failed", errors);

  if (!caseData?.departmentName) {
    return;
  }

  await tryCleanup("cleanupEnquiryState: AppointmentSlotClaims.delete failed", () =>
    releaseAppointmentSlotForDetails(caseData.departmentName, date, time),
  );
}

// Deletes all appointments related to a case and releases their claimed slots
async function deleteRelatedAppointments(
  client: AmplifyClient,
  caseId: string,
  departmentName: string | null,
) {
  const appointments = await listAllPages(
    (nextToken) =>
      client.models.Appointment.list({
        filter: {
          caseId: { eq: caseId },
        },
        nextToken,
      }),
    "cleanupEnquiryState: Appointment.list failed",
  );

  for (const appointment of appointments) {
    // Delete the appointment, if it fails do not release the slot
    if (
      !(await tryCleanup("cleanupEnquiryState: Appointment.delete failed", () =>
        runCleanup(
          "cleanupEnquiryState: Appointment.delete failed",
          `Failed to delete appointment ${appointment.id}`,
          () => client.models.Appointment.delete({ id: appointment.id }),
        ),
      ))
    ) {
      continue;
    }

    // If appointment was successfully deleted, release the claimed slot
    if (departmentName && appointment.date && appointment.time) {
      const date = appointment.date;
      const time = appointment.time;

      await tryCleanup("cleanupEnquiryState: AppointmentSlotClaims.delete failed", () =>
        releaseAppointmentSlotForDetails(departmentName, date, time),
      );
    }
  }
}

// Deletes all tickets related to a case
async function deleteRelatedTickets(client: AmplifyClient, caseId: string) {
  const tickets = await listAllPages(
    (nextToken) =>
      client.models.Ticket.list({
        filter: {
          caseId: { eq: caseId },
        },
        nextToken,
      }),
    "cleanupEnquiryState: Ticket.list failed",
  );

  for (const ticket of tickets) {
    // Successful deletes emit Ticket REMOVE events, which release claimed digits and queue positions.
    await tryCleanup("cleanupEnquiryState: Ticket.delete failed", () =>
      runCleanup(
        "cleanupEnquiryState: Ticket.delete failed",
        `Failed to delete ticket ${ticket.id}`,
        () => client.models.Ticket.delete({ id: ticket.id }),
      ),
    );
  }
}

// Handler for DynamoDB stream events to clean up enquiry state when tickets are completed or deleted
async function handleTicketRecord(record: DynamoDBRecord) {
  const { oldImage, newImage } = getRecordImages(record);

  if (record.eventName === "MODIFY") {
    if (oldImage && newImage && oldImage.status === "WAITING" && newImage.status === "COMPLETED") {
      await releaseTicketClaims(newImage, true);
    }
    return;
  }

  if (record.eventName === "REMOVE" && oldImage) {
    await releaseTicketClaims(oldImage, oldImage.status === "WAITING");
  }
}

// Handler for DynamoDB stream events to clean up enquiry state when cases are deleted
async function handleCaseRecord(record: DynamoDBRecord, client: AmplifyClient) {
  const { oldImage } = getRecordImages(record);

  if (record.eventName === "REMOVE" && oldImage && typeof oldImage.id === "string") {
    await tryCleanup("cleanupEnquiryState: CaseReferenceClaims.delete failed", () =>
      releaseCaseReferenceClaim(oldImage),
    );
    await deleteRelatedAppointments(
      client,
      oldImage.id,
      typeof oldImage.departmentName === "string" ? oldImage.departmentName : null,
    );
    await deleteRelatedTickets(client, oldImage.id);
  }
}

// Handler for DynamoDB stream events to clean up enquiry state when appointments are cancelled, or deleted (no need for when completed as they automatically expire afterwards)
async function handleAppointmentRecord(record: DynamoDBRecord, client: AmplifyClient) {
  const { oldImage, newImage } = getRecordImages(record);

  if (record.eventName === "MODIFY") {
    if (
      oldImage &&
      newImage &&
      oldImage.status !== "CANCELLED" &&
      newImage.status === "CANCELLED"
    ) {
      await releaseAppointmentSlotForAppointmentRecord(client, newImage);
    }
    return;
  }

  if (record.eventName === "REMOVE" && oldImage) {
    await releaseAppointmentSlotForAppointmentRecord(client, oldImage);
  }
}

export const handler: DynamoDBStreamHandler = async (event) => {
  const client = await getAmplifyClient();
  const { ticketTableName, caseTableName, appointmentTableName } = getTableNames();

  for (const record of event.Records) {
    const tableName = getRecordTableName(record);

    if (tableName === ticketTableName) {
      await handleTicketRecord(record);
      continue;
    }

    if (tableName === caseTableName) {
      await handleCaseRecord(record, client);
      continue;
    }

    if (tableName === appointmentTableName) {
      await handleAppointmentRecord(record, client);
    }
  }
};
