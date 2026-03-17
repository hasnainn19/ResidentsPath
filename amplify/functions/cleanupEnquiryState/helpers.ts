import type { DynamoDBRecord } from "aws-lambda";
import { type AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  getDate,
  releaseCaseReferenceNumber,
  releaseQueuePosition,
  releaseTicketNumber,
} from "../utils/enquiriesStateTable";
import { logModelErrors, tryCleanup } from "../utils/runCleanup";

export type StreamItem = Record<string, unknown>;

type ListPage<TItem> = {
  data?: TItem[] | null;
  errors?: unknown[];
  nextToken?: string | null;
};

function unmarshallImage(image?: Record<string, AttributeValue>) {
  if (!image) return null;
  return unmarshall(image);
}

export function getRecordImages(record: DynamoDBRecord) {
  return {
    oldImage: unmarshallImage(
      record.dynamodb?.OldImage as Record<string, AttributeValue> | undefined,
    ),
    newImage: unmarshallImage(
      record.dynamodb?.NewImage as Record<string, AttributeValue> | undefined,
    ),
  };
}

export async function listAllPages<TItem>(
  listPage: (nextToken: string | null | undefined) => Promise<ListPage<TItem>>,
  listFailureLogPrefix: string,
) {
  const items: TItem[] = [];
  let nextToken: string | null | undefined = null;

  do {
    const response = await listPage(nextToken);
    logModelErrors(listFailureLogPrefix, response.errors);

    items.push(...(response.data ?? []));
    nextToken = response.nextToken;
  } while (nextToken);

  return items;
}

function getRequiredTableName(envName: "TICKET_TABLE_NAME" | "CASE_TABLE_NAME" | "APPOINTMENT_TABLE_NAME") {
  const tableName = process.env[envName];

  if (!tableName) {
    throw new Error(`${envName} is not set`);
  }

  return tableName;
}

export function getTableNames() {
  return {
    ticketTableName: getRequiredTableName("TICKET_TABLE_NAME"),
    caseTableName: getRequiredTableName("CASE_TABLE_NAME"),
    appointmentTableName: getRequiredTableName("APPOINTMENT_TABLE_NAME"),
  };
}

export function getRecordTableName(record: DynamoDBRecord) {
  const tableNameMatch = record.eventSourceARN?.match(/:table\/([^/]+)\/stream\//);
  return tableNameMatch?.[1] ?? null;
}

// Get the queueId (department code) and ticketDigits from a ticket
function getTicketClaimInfo(ticket: StreamItem) {
  const ticketNumber = typeof ticket.ticketNumber === "string" ? ticket.ticketNumber : null;
  const createdAt = ticket.createdAt as string;

  if (
    !ticketNumber ||
    !/^\d{3}$/.test(ticketNumber.slice(-3)) ||
    !ticketNumber.slice(0, -3)
  ) {
    return null;
  }

  const createdAtMs = Date.parse(createdAt);

  if (!Number.isFinite(createdAtMs)) {
    return null;
  }

  return {
    queueId: `${getDate(new Date(createdAtMs))}#${ticketNumber.slice(0, -3)}`,
    ticketDigits: ticketNumber.slice(-3),
  };
}

function getQueuePositionClaimInfo(ticket: StreamItem) {
  const departmentName = typeof ticket.departmentName === "string" ? ticket.departmentName : null;
  const createdAt = ticket.createdAt as string;

  if (!departmentName) {
    return null;
  }

  const createdAtMs = Date.parse(createdAt);

  if (!Number.isFinite(createdAtMs)) {
    return null;
  }

  return {
    queuePositionKey: `${getDate(new Date(createdAtMs))}#${departmentName}`,
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

export async function releaseTicketClaims(ticket: StreamItem, shouldReleaseQueuePosition: boolean) {
  await tryCleanup("cleanupEnquiryState: TicketNumberClaims.delete failed", () =>
    releaseTicketNumberClaim(ticket),
  );

  if (shouldReleaseQueuePosition) {
    await tryCleanup("cleanupEnquiryState: QueuePositionCounter.update failed", () =>
      releaseQueuePositionClaim(ticket),
    );
  }
}

export async function releaseCaseReferenceClaim(caseRecord: StreamItem) {
  if (typeof caseRecord.referenceNumber !== "string") return false;

  await releaseCaseReferenceNumber(caseRecord.referenceNumber);
  return true;
}
