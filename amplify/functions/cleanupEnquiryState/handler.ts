import type { DynamoDBRecord, DynamoDBStreamHandler } from "aws-lambda";
import { type AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { getAmplifyClient, type AmplifyClient } from "../utils/amplifyClient";
import {
  getDate,
  releaseAppointmentSlot,
  releaseCaseReferenceNumber,
  releaseQueuePosition,
  releaseTicketNumber,
} from "../utils/enquiriesStateTable";
import { logModelErrors, runCleanup, tryCleanup } from "../utils/runCleanup";

type StreamItem = Record<string, unknown>;
type AppointmentListPage = {
  data?: Array<{ id: string; date?: string | null; time?: string | null }> | null;
  errors?: unknown[];
  nextToken?: string | null;
};
type TicketListPage = {
  data?: Array<{ id: string }> | null;
  errors?: unknown[];
  nextToken?: string | null;
};

function unmarshallImage(image?: Record<string, AttributeValue>) {
  if (!image) return null;
  return unmarshall(image);
}

// Get the queueId (department code) and ticketDigits from a ticket
function getTicketClaimInfo(ticket: StreamItem) {
  const ticketNumber = typeof ticket.ticketNumber === "string" ? ticket.ticketNumber : null;
  const createdAt = typeof ticket.createdAt === "string" ? ticket.createdAt : null;

  if (
    !ticketNumber ||
    !createdAt ||
    !/^\d{3}$/.test(ticketNumber.slice(-3)) ||
    !ticketNumber.slice(0, -3)
  ) {
    return null;
  }

  return {
    queueId: `${getDate(new Date(createdAt))}#${ticketNumber.slice(0, -3)}`,
    ticketDigits: ticketNumber.slice(-3),
  };
}

function getQueuePositionClaimInfo(ticket: StreamItem) {
  const departmentId = typeof ticket.departmentId === "string" ? ticket.departmentId : null;
  const createdAt = typeof ticket.createdAt === "string" ? ticket.createdAt : null;

  if (!departmentId || !createdAt) {
    return null;
  }

  const createdAtMs = Date.parse(createdAt);

  if (!Number.isFinite(createdAtMs)) {
    return null;
  }

  return {
    queuePositionKey: `${getDate(new Date(createdAtMs))}#${departmentId}`,
  };
}

async function releaseTicketNumberClaim(ticket: StreamItem) {
  const claim = getTicketClaimInfo(ticket);
  if (!claim) return false;

  await releaseTicketNumber(claim.queueId, claim.ticketDigits);
  return true;
}

async function releaseQueuePositionClaim(ticket: StreamItem) {
  const claim = getQueuePositionClaimInfo(ticket);
  if (!claim) return false;

  await releaseQueuePosition(claim.queuePositionKey);
  return true;
}

async function releaseCaseReferenceClaim(caseRecord: StreamItem) {
  if (typeof caseRecord.referenceNumber !== "string") return false;

  await releaseCaseReferenceNumber(caseRecord.referenceNumber);
  return true;
}

async function releaseAppointmentSlotForDetails(
  departmentId: string,
  dateIso: string,
  time: string,
) {
  await releaseAppointmentSlot({ departmentId, dateIso, time });
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

  if (!caseData?.departmentId) {
    return;
  }

  await tryCleanup("cleanupEnquiryState: AppointmentSlotClaims.delete failed", () =>
    releaseAppointmentSlotForDetails(caseData.departmentId, date, time),
  );
}

// Deletes all appointments related to a case and releases their claimed slots
async function deleteRelatedAppointments(
  client: AmplifyClient,
  caseId: string,
  departmentId: string | null,
) {
  const appointments: NonNullable<AppointmentListPage["data"]> = [];
  let nextToken: string | null | undefined = null;

  do {
    const response: AppointmentListPage = await client.models.Appointment.list({
      filter: {
        caseId: { eq: caseId },
      },
      nextToken,
    });

    logModelErrors("cleanupEnquiryState: Appointment.list failed", response.errors);

    appointments.push(...(response.data ?? []));
    nextToken = response.nextToken;
  } while (nextToken);

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
    if (departmentId && appointment.date && appointment.time) {
      const date = appointment.date;
      const time = appointment.time;

      await tryCleanup("cleanupEnquiryState: AppointmentSlotClaims.delete failed", () =>
        releaseAppointmentSlotForDetails(departmentId, date, time),
      );
    }
  }
}

// Deletes all tickets related to a case
async function deleteRelatedTickets(client: AmplifyClient, caseId: string) {
  const tickets: NonNullable<TicketListPage["data"]> = [];
  let nextToken: string | null | undefined = null;

  do {
    const response: TicketListPage = await client.models.Ticket.list({
      filter: {
        caseId: { eq: caseId },
      },
      nextToken,
    });

    logModelErrors("cleanupEnquiryState: Ticket.list failed", response.errors);

    tickets.push(...(response.data ?? []));
    nextToken = response.nextToken;
  } while (nextToken);

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
  const oldImage = unmarshallImage(
    record.dynamodb?.OldImage as Record<string, AttributeValue> | undefined,
  );
  const newImage = unmarshallImage(
    record.dynamodb?.NewImage as Record<string, AttributeValue> | undefined,
  );

  if (record.eventName === "MODIFY") {
    if (oldImage && newImage && oldImage.status === "WAITING" && newImage.status === "COMPLETED") {
      await tryCleanup("cleanupEnquiryState: TicketNumberClaims.delete failed", () =>
        releaseTicketNumberClaim(newImage),
      );
      await tryCleanup("cleanupEnquiryState: QueuePositionCounter.update failed", () =>
        releaseQueuePositionClaim(newImage),
      );
    }
    return;
  }

  if (record.eventName === "REMOVE" && oldImage) {
    await tryCleanup("cleanupEnquiryState: TicketNumberClaims.delete failed", () =>
      releaseTicketNumberClaim(oldImage),
    );
    if (oldImage.status === "WAITING") {
      await tryCleanup("cleanupEnquiryState: QueuePositionCounter.update failed", () =>
        releaseQueuePositionClaim(oldImage),
      );
    }
  }
}

// Handler for DynamoDB stream events to clean up enquiry state when cases are deleted
async function handleCaseRecord(record: DynamoDBRecord, client: AmplifyClient) {
  const oldImage = unmarshallImage(
    record.dynamodb?.OldImage as Record<string, AttributeValue> | undefined,
  );

  if (record.eventName === "REMOVE" && oldImage && typeof oldImage.id === "string") {
    await tryCleanup("cleanupEnquiryState: CaseReferenceClaims.delete failed", () =>
      releaseCaseReferenceClaim(oldImage),
    );
    await deleteRelatedAppointments(
      client,
      oldImage.id,
      typeof oldImage.departmentId === "string" ? oldImage.departmentId : null,
    );
    await deleteRelatedTickets(client, oldImage.id);
  }
}

// Handler for DynamoDB stream events to clean up enquiry state when appointments are cancelled, or deleted (no need for when completed as they automatically expire afterwards)
async function handleAppointmentRecord(record: DynamoDBRecord, client: AmplifyClient) {
  const oldImage = unmarshallImage(
    record.dynamodb?.OldImage as Record<string, AttributeValue> | undefined,
  );
  const newImage = unmarshallImage(
    record.dynamodb?.NewImage as Record<string, AttributeValue> | undefined,
  );

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

  const ticketTableName = process.env.TICKET_TABLE_NAME;
  if (!ticketTableName) {
    throw new Error("TICKET_TABLE_NAME is not set");
  }

  const caseTableName = process.env.CASE_TABLE_NAME;
  if (!caseTableName) {
    throw new Error("CASE_TABLE_NAME is not set");
  }

  const appointmentTableName = process.env.APPOINTMENT_TABLE_NAME;
  if (!appointmentTableName) {
    throw new Error("APPOINTMENT_TABLE_NAME is not set");
  }

  for (const record of event.Records) {
    const tableNameMatch = record.eventSourceARN?.match(/:table\/([^/]+)\/stream\//);
    const tableName = tableNameMatch?.[1] ?? null;

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
