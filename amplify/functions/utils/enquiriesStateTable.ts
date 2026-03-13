import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({});

export type AppointmentSlotClaim = {
  departmentId: string;
  dateIso: string;
  time: string;
};

type AppointmentSlotState = "PENDING" | "BOOKED";

export function getEnquiriesStateTableName() {
  const tableName = process.env.ENQUIRIES_STATE_TABLE;
  if (!tableName) throw new Error("ENQUIRIES_STATE_TABLE is not set");
  return tableName;
}

function getCaseReferenceClaimKey(referenceNumber: string) {
  return {
    pk: `CASE_REFERENCE#${referenceNumber}`,
    sk: "CLAIM",
  };
}

function getTicketClaimKey(queueId: string, ticketNumber: string) {
  return {
    pk: `QUEUE#${queueId}`,
    sk: `TICKET#${ticketNumber}`,
  };
}

function getAppointmentSlotClaimKey(departmentId: string, dateIso: string, time: string) {
  return {
    pk: `APPOINTMENT_SLOT#${departmentId}#${dateIso}`,
    sk: `TIME#${time}`,
  };
}

export function daysFromNowInSeconds(days: number): number {
  return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
}

// Get the current date in London and format it as YYYYMMDD to use as a key for daily ticket counters
export function getDate(d = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) throw new Error("Failed to compute date");
  return `${year}${month}${day}`;
}

// Attempt to claim a reference number by inserting a record into the enquiries state table
export async function claimCaseReferenceNumber(referenceNumber: string) {
  const tableName = getEnquiriesStateTableName();
  const key = getCaseReferenceClaimKey(referenceNumber);

  await ddb.send(
    new PutItemCommand({
      TableName: tableName,
      Item: {
        pk: { S: key.pk },
        sk: { S: key.sk },
        allocatedAt: { N: String(Date.now()) },
      },
      ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
    }),
  );
}

// Release a claimed reference number by deleting the corresponding record from the enquiries state table
export async function releaseCaseReferenceNumber(referenceNumber: string) {
  const tableName = process.env.ENQUIRIES_STATE_TABLE;
  if (!tableName) return;

  const key = getCaseReferenceClaimKey(referenceNumber);

  await ddb.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: {
        pk: { S: key.pk },
        sk: { S: key.sk },
      },
    }),
  );
}

// Calculate an expiry time for a booked appointment slot, which is the end of the day of the
// appointment plus a buffer of 7 days
function getBookedAppointmentSlotExpiresAt(dateIso: string) {
  const endOfDayMs = Date.parse(`${dateIso}T23:59:59Z`);

  if (!Number.isFinite(endOfDayMs)) {
    return daysFromNowInSeconds(30);
  }

  return Math.floor(endOfDayMs / 1000) + 7 * 24 * 60 * 60;
}

// Atomically claim an appointment slot by inserting a brief pending record into the
// enquiries state table. If the Lambda crashes before the appointment is created,
// availability will stop treating this slot as blocked after the pending expiry passes.
export async function claimAppointmentSlot(slot: AppointmentSlotClaim) {
  const tableName = getEnquiriesStateTableName();
  const key = getAppointmentSlotClaimKey(slot.departmentId, slot.dateIso, slot.time);

  await ddb.send(
    new PutItemCommand({
      TableName: tableName,
      Item: {
        pk: { S: key.pk },
        sk: { S: key.sk },
        status: { S: "PENDING" },
        allocatedAt: { N: String(Date.now()) },
        // Set the expiry to 15 minutes from now to allow some time for the appointment creation to complete
        expiresAt: { N: String(Math.floor(Date.now() / 1000) + 15 * 60) },
      },
      ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
    }),
  );
}

// Mark an appointment slot as booked after the appointment has been successfully created
export async function markAppointmentSlotBooked(slot: AppointmentSlotClaim) {
  const tableName = getEnquiriesStateTableName();
  const key = getAppointmentSlotClaimKey(slot.departmentId, slot.dateIso, slot.time);

  await ddb.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        pk: { S: key.pk },
        sk: { S: key.sk },
      },
      UpdateExpression: "SET #status = :booked, expiresAt = :expiresAt",
      ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":booked": { S: "BOOKED" satisfies AppointmentSlotState },
        ":expiresAt": { N: String(getBookedAppointmentSlotExpiresAt(slot.dateIso)) },
      },
    }),
  );
}

export async function releaseAppointmentSlot(slot: AppointmentSlotClaim) {
  const tableName = process.env.ENQUIRIES_STATE_TABLE;
  if (!tableName) return;

  const key = getAppointmentSlotClaimKey(slot.departmentId, slot.dateIso, slot.time);

  await ddb.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: {
        pk: { S: key.pk },
        sk: { S: key.sk },
      },
    }),
  );
}

// Attempt to claim a ticket number for a queue by inserting a record into the enquiries state table
// If the record already exists, it means another process has claimed that ticket number, so try the next one
export async function claimTicketDigits(queueId: string, ticketNumber: string) {
  const tableName = getEnquiriesStateTableName();
  const key = getTicketClaimKey(queueId, ticketNumber);

  await ddb.send(
    new PutItemCommand({
      TableName: tableName,
      Item: {
        pk: { S: key.pk },
        sk: { S: key.sk },
        allocatedAt: { N: String(Date.now()) },
        expiresAt: { N: String(daysFromNowInSeconds(3)) },
      },
      ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
    }),
  );
}

// Release a claimed ticket number by deleting the corresponding record from the enquiries state table
export async function releaseTicketNumber(queueId: string, ticketNumber: string) {
  const tableName = process.env.ENQUIRIES_STATE_TABLE;
  if (!tableName) return;

  const key = getTicketClaimKey(queueId, ticketNumber);

  await ddb.send(
    new DeleteItemCommand({
      TableName: tableName,
      Key: {
        pk: { S: key.pk },
        sk: { S: key.sk },
      },
    }),
  );
}
