/**
 * This function handles the submission of an enquiry form. It performs the following steps:
 * Validates and cleans the input data
 * Configures Amplify and initialises the data client
 * Checks if the user is logged into an account, or creates a new guest user if not
 * Creates a new case with the enquiry details
 * Depending on the user's choice, it either books an appointment or creates a ticket for the case
 *
 * The function returns a reference number for the enquiry if successful
 */

import { randomBytes } from "crypto";
import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";
import { formSchema } from "../../../shared/formSchema";
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
  DeleteItemCommand,
  ScanCommand,
  type ScanCommandInput,
} from "@aws-sdk/client-dynamodb";
import { getAmplifyClient } from "../utils/amplifyClient";

type DataClient = ReturnType<typeof generateClient<Schema>>;
type UserCreateInput = Parameters<DataClient["models"]["User"]["create"]>[0];
type CaseCreateInput = Parameters<DataClient["models"]["Case"]["create"]>[0];

type SubmitEnquiryErrorCode = "VALIDATION" | "CAPACITY" | "CONFLICT" | "SERVER";

type SubmitEnquiryResult = {
  ok: boolean;
  referenceNumber?: string;
  ticketNumber?: string;
  errorCode?: SubmitEnquiryErrorCode;
  errorMessage?: string;
};

function removeIrrelevantValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed === "") continue;
      (out as Record<string, unknown>)[k] = trimmed;
      continue;
    }
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

// Log errors from model operations
function logModelErrors(prefix: string, errors: unknown[] | undefined) {
  if (!Array.isArray(errors) || errors.length === 0) return;

  const safe = errors.map((error) => {
    const item = error as { message?: unknown; errorType?: unknown };

    return {
      message: typeof item.message === "string" ? item.message.slice(0, 200) : "unknown",
      errorType: typeof item.errorType === "string" ? item.errorType : undefined,
    };
  });
  console.error(prefix, safe);
}

// Generate a random string of given length from the provided character set, using crypto for randomness
function cryptoRandomFrom(set: string, length: number): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += set[bytes[i] % set.length];
  }
  return result;
}

// Generate a reference number in the format "ABC-123456" where ABC are random letters and 123456 are random alphanumeric characters
export function generateReferenceNumber(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const prefix = cryptoRandomFrom(letters, 3);
  const suffix = cryptoRandomFrom(chars, 6);

  return `${prefix}-${suffix}`;
}

const ddb = new DynamoDBClient({});

function getEnquiriesStateTableName() {
  const tableName = process.env.ENQUIRIES_STATE_TABLE;
  if (!tableName) throw new Error("ENQUIRIES_STATE_TABLE is not set");
  return tableName;
}

function getTicketTableName() {
  const tableName = process.env.TICKET_TABLE_NAME;
  if (!tableName) throw new Error("TICKET_TABLE_NAME is not set");
  return tableName;
}

function getCaseReferenceClaimKey(referenceNumber: string) {
  return {
    pk: `CASE_REFERENCE#${referenceNumber}`,
    sk: "CLAIM",
  };
}

function getTicketCounterKey(queueId: string) {
  return {
    pk: `QUEUE#${queueId}`,
    sk: "COUNTER",
  };
}

function getTicketClaimKey(queueId: string, ticketNumber: string) {
  return {
    pk: `QUEUE#${queueId}`,
    sk: `TICKET#${ticketNumber}`,
  };
}

function getQueuePositionLockKey(serviceDayQueueKey: string) {
  return {
    pk: `QUEUE_POSITION#${serviceDayQueueKey}`,
    sk: "LOCK",
  };
}

function getAppointmentSlotClaimKey(departmentId: DepartmentId, dateIso: string, time: string) {
  return {
    pk: `APPOINTMENT_SLOT#${departmentId}#${dateIso}`,
    sk: `TIME#${time}`,
  };
}

// Attempt to claim a reference number by inserting a record into the enquiries state table
async function claimCaseReferenceNumber(referenceNumber: string) {
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
async function releaseCaseReferenceNumber(referenceNumber: string) {
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

// Attempt to allocate a unique case reference number by generating random reference numbers
// and trying to claim them until one succeeds or a maximum number of attempts is reached
// This avoids race conditions and ensures uniqueness without needing to query the database for existing reference numbers
async function allocateCaseReferenceNumber() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const referenceNumber = generateReferenceNumber();

    try {
      await claimCaseReferenceNumber(referenceNumber);
      return referenceNumber;
    } catch (e: any) {
      const name = typeof e?.name === "string" ? e.name : "";
      // If the error is a ConditionalCheckFailedException, it means the reference number is already claimed so continue the loop
      if (name === "ConditionalCheckFailedException") continue;
      throw e;
    }
  }

  throw new Error("Failed to allocate a unique case reference");
}

function daysFromNowInSeconds(days: number): number {
  return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
}

// Get the current date in London and format it as YYYYMMDD to use as a key for daily ticket counters
function getDate(d = new Date()): string {
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

type DepartmentId = ReturnType<typeof formSchema.parse>["departmentId"];
type AppointmentSlotClaim = {
  departmentId: DepartmentId;
  dateIso: string;
  time: string;
};
type AppointmentSlotState = "PENDING" | "BOOKED";
type QueuePositionLock = {
  serviceDayQueueKey: string;
  ownerToken: string;
  serviceDay: string;
};

const DepartmentCodeById: Record<DepartmentId, string> = {
  HOMELESSNESS: "H",
  ADULTS_DUTY: "A",
  CHILDRENS_DUTY: "C",
  COMMUNITY_HUB_ADVISOR: "CH",
  COUNCIL_TAX_OR_HOUSING_BENEFIT_HELP: "CT",
  GENERAL_CUSTOMER_SERVICES: "G",
};

function getDepartmentCode(departmentId: DepartmentId): string {
  const code = DepartmentCodeById[departmentId];
  if (!code) throw new Error(`No department code configured for ${departmentId}`);
  return code;
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
async function claimAppointmentSlot(slot: AppointmentSlotClaim) {
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
async function markAppointmentSlotBooked(slot: AppointmentSlotClaim) {
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

async function releaseAppointmentSlot(slot: AppointmentSlotClaim) {
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

// Claim a position in the queue for a department by inserting a lock record into the enquiries state table
// This avoids race conditions when allocating the next queue position
async function claimQueuePositionLock(departmentId: DepartmentId): Promise<QueuePositionLock> {
  const tableName = getEnquiriesStateTableName();
  const serviceDay = getDate();
  const serviceDayQueueKey = `${serviceDay}#${departmentId}`;
  const key = getQueuePositionLockKey(serviceDayQueueKey);
  // Generate a random token to identify the owner of the lock, which will be used to ensure only the owner can release it
  const ownerToken = randomBytes(12).toString("hex");

  // Try to claim the lock by inserting a record. If the record already exists, it means another process has claimed the lock,
  // so wait and try again at most 20 times
  for (let attempt = 0; attempt < 20; attempt++) {
    const nowInSeconds = Math.floor(Date.now() / 1000);

    try {
      await ddb.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            pk: { S: key.pk },
            sk: { S: key.sk },
            ownerToken: { S: ownerToken },
            allocatedAt: { N: String(Date.now()) },
            // Expire the lock after 30 seconds to prevent deadlocks in case the process crashes before releasing it
            expiresAt: { N: String(nowInSeconds + 30) },
          },
          ConditionExpression: "attribute_not_exists(pk) OR expiresAt < :now",
          ExpressionAttributeValues: {
            ":now": { N: String(nowInSeconds) },
          },
        }),
      );

      return {
        serviceDayQueueKey,
        ownerToken,
        serviceDay,
      };
    } catch (e: any) {
      const name = typeof e?.name === "string" ? e.name : "";
      // If the error is a ConditionalCheckFailedException, it means the lock is currently held by another process, so wait and try again
      if (name !== "ConditionalCheckFailedException") {
        throw e;
      }
    }

    if (attempt < 19) {
      // jitter to prevent multiple lambdas from retrying at the same time and getting stuck
      const jitter = randomBytes(1)[0] % 25;

      // Wait for a short time before trying again so as not to submit too many requests to DynamoDB in a short time
      // Waits for 50ms on the first attempt, increases by 25ms for each subsequent attempt, and adds a small jitter
      await new Promise((resolve) => setTimeout(resolve, 50 + attempt * 25 + jitter));
    }
  }

  throw new Error(`Failed to claim queue position lock for ${departmentId}`);
}

async function releaseQueuePositionLock(lock: QueuePositionLock) {
  const tableName = process.env.ENQUIRIES_STATE_TABLE;
  if (!tableName) {
    return;
  }

  const key = getQueuePositionLockKey(lock.serviceDayQueueKey);

  try {
    await ddb.send(
      new DeleteItemCommand({
        TableName: tableName,
        Key: {
          pk: { S: key.pk },
          sk: { S: key.sk },
        },
        ConditionExpression: "ownerToken = :ownerToken",
        ExpressionAttributeValues: {
          ":ownerToken": { S: lock.ownerToken },
        },
      }),
    );
  } catch (e: any) {
    const name = typeof e?.name === "string" ? e.name : "";
    if (name === "ConditionalCheckFailedException") {
      return;
    }

    throw e;
  }
}

// Get the next position in the queue for a department by scanning the Ticket table for tickets in the same department and service day, and finding the maximum position among them
async function getNextQueuePosition(
  departmentId: DepartmentId,
  serviceDay: string,
): Promise<number> {
  const tableName = getTicketTableName();
  let furthestBackPosition = -1;
  // exclusiveStartKey is used for paginating through the results of the scan, as DynamoDB may not return all matching items in a single response if there are many
  let exclusiveStartKey: ScanCommandInput["ExclusiveStartKey"];

  do {
    const result = await ddb.send(
      new ScanCommand({
        TableName: tableName,
        // Use consistent read to ensure we see the most recent data
        ConsistentRead: true,
        ExclusiveStartKey: exclusiveStartKey,
        ProjectionExpression: "#position, createdAt",
        // Filter for tickets in the same department and with status WAITING
        FilterExpression: "departmentId = :departmentId AND #status = :waiting",
        ExpressionAttributeNames: {
          "#position": "position",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":departmentId": { S: departmentId },
          ":waiting": { S: "WAITING" },
        },
      }),
    );

    for (const item of result.Items ?? []) {
      // For each ticket, check if it belongs to the same service day by looking at createdAt 
      const createdAt = item.createdAt?.S ?? null;
      const createdAtMs = createdAt ? Date.parse(createdAt) : Number.NaN;
      const hasValidCreatedAt = Number.isFinite(createdAtMs);
      const ticketServiceDay = hasValidCreatedAt ? getDate(new Date(createdAtMs)) : null;
      const positionRaw = item.position?.N;
      const position = typeof positionRaw === "string" ? Number(positionRaw) : Number.NaN;

      if (ticketServiceDay === serviceDay && Number.isFinite(position) && position >= 0) {
        furthestBackPosition = Math.max(furthestBackPosition, position);
      }
    }

    // If LastEvaluatedKey is present in the result, it means there are more items to scan, so set exclusiveStartKey to that key to get the next page of results in the next iteration
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return furthestBackPosition + 1;
}

// Atomically increment and retrieve the next ticket index for a queue from DynamoDB, ensuring uniqueness without race conditions
async function getNextTicketIndex(queueId: string): Promise<number> {
  const tableName = getEnquiriesStateTableName();
  const key = getTicketCounterKey(queueId);

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: {
        pk: { S: key.pk },
        sk: { S: key.sk },
      },
      UpdateExpression: "SET #next = if_not_exists(#next, :zero) + :one, expiresAt = :expiresAt",
      ExpressionAttributeNames: { "#next": "next" },
      ExpressionAttributeValues: {
        ":zero": { N: "0" },
        ":one": { N: "1" },
        ":expiresAt": { N: String(daysFromNowInSeconds(3)) },
      },
      ReturnValues: "UPDATED_NEW",
    }),
  );

  const nextStr = res.Attributes?.next?.N;
  const next = typeof nextStr === "string" ? Number(nextStr) : NaN;
  if (!Number.isFinite(next)) throw new Error("Ticket counter did not return a valid value");

  return (next - 1) % 1000;
}

// Attempt to claim a ticket number for a queue by inserting a record into the enquiries state table
// If the record already exists, it means another process has claimed that ticket number, so try the next one
async function claimTicketDigits(queueId: string, ticketNumber: string) {
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
async function releaseTicketNumber(queueId: string, ticketNumber: string) {
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

type AllocateDeptTicketNumberResult =
  | {
      ok: true;
      queueId: string;
      ticketNumber: string;
      ticketDigits: string;
    }
  | {
      ok: false;
      errorCode: "CAPACITY";
      errorMessage: string;
    };

// Atomically allocate a unique 3 digit ticket number for the current service day and department
// TicketNumber is in the form "X000" where X represents the first (or first two) letter(s) of the department and 000 is a zero-padded number from 000 to 999
async function allocateDeptTicketNumber(
  departmentCode: string,
): Promise<AllocateDeptTicketNumberResult> {
  const serviceDay = getDate();
  const queueId = `${serviceDay}#${departmentCode}`;

  const start = await getNextTicketIndex(queueId);

  for (let i = 0; i < 1000; i++) {
    const idx = (start + i) % 1000;
    const ticketDigits = String(idx).padStart(3, "0");

    try {
      await claimTicketDigits(queueId, ticketDigits);
      return {
        ok: true,
        queueId,
        ticketDigits,
        ticketNumber: `${departmentCode}${ticketDigits}`,
      };
    } catch (e: any) {
      const name = typeof e?.name === "string" ? e.name : "";
      // If the error is a ConditionalCheckFailedException, it means the ticket number is already claimed so continue the loop
      if (name === "ConditionalCheckFailedException") continue;
      throw e;
    }
  }

  return {
    ok: false,
    errorCode: "CAPACITY",
    errorMessage: "The queue is currently at capacity. Please try again later.",
  };
}

// Update existing user details with new information from the form
function updateUserInfo(validated: ReturnType<typeof formSchema.parse>): Partial<UserCreateInput> {
  return removeIrrelevantValues({
    firstName: validated.firstName,
    middleNames: validated.middleName,
    lastName: validated.lastName,
    preferredName: validated.preferredName,
    pronouns: validated.pronouns,
    pronounsOtherText: validated.pronounsOtherText,

    additionalEmail: validated.email,
    phoneNumber: validated.phone,

    addressLine1: validated.addressLine1,
    addressLine2: validated.addressLine2,
    addressLine3: validated.addressLine3,
    city: validated.townOrCity,
    postcode: validated.postcode,
  }) as Partial<UserCreateInput>;
}

// Delete created records in case of failure
async function tryDelete(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`submitEnquiry: cleanup ${label} failed`, msg);
    return false;
  }
}

export const handler: Schema["submitEnquiry"]["functionHandler"] = async (event) => {
  const { input } = event.arguments;

  // Validate the input against the schema used for frontend and backend, ensuring it has the expected shape and types
  const parsed = formSchema.safeParse(input);
  if (!parsed.success) {
    console.warn("submitEnquiry: validation failed", {
      issueCount: parsed.error.issues.length,
      firstIssue: parsed.error.issues[0]?.message,
    });

    const result: SubmitEnquiryResult = {
      ok: false,
      errorCode: "VALIDATION",
      errorMessage: "Please check your answers and try again.",
    };

    return result;
  }

  const validated = parsed.data;

  const supportNeedsJson = validated.supportNeeds
    ? JSON.stringify(validated.supportNeeds)
    : undefined;

  const client = await getAmplifyClient();

  const identity = event.identity;
  const sub =
    identity && typeof identity === "object" && "sub" in identity ? (identity.sub as string) : null;

  let userId: string | null = null;
  let createdGuestUserId: string | null = null;

  // If the user is logged in, try to find their account in the User model by their Cognito sub
  if (sub) {
    try {
      const { data: user, errors } = await client.models.User.get({ id: sub });

      if (!errors?.length && user && user.id) {
        userId = user.id;

        // Overwrite saved details with any new information provided
        const updatedFields = updateUserInfo(validated);
        if (Object.keys(updatedFields).length) {
          const { errors: updateErrors } = await client.models.User.update({
            id: userId,
            ...updatedFields,
          } as any);

          if (updateErrors?.length) {
            logModelErrors("submitEnquiry: User.update failed", updateErrors);
          }
        }
      }
    } catch (e) {
      console.error("submitEnquiry: user lookup failed", e);
    }
  }

  // If no user found, create a new guest user with the provided details
  if (!userId) {
    const userCreateInput = removeIrrelevantValues({
      id: sub ?? undefined,
      isRegistered: false,

      firstName: validated.firstName,
      middleNames: validated.middleName,
      lastName: validated.lastName,
      preferredName: validated.preferredName,
      pronouns: validated.pronouns,
      pronounsOtherText: validated.pronounsOtherText,

      email: validated.email,
      phoneNumber: validated.phone,

      addressLine1: validated.addressLine1,
      addressLine2: validated.addressLine2,
      addressLine3: validated.addressLine3,
      city: validated.townOrCity,
      postcode: validated.postcode,
    });

    const { data: guestUserData, errors: guestUserErrors } = await client.models.User.create(
      userCreateInput as UserCreateInput,
    );

    if (guestUserErrors?.length || !guestUserData?.id) {
      logModelErrors("submitEnquiry: User.create failed", guestUserErrors);
      return {
        ok: false,
        errorCode: "SERVER",
        errorMessage: "Submission failed. Please try again.",
      };
    }

    userId = guestUserData.id;
    createdGuestUserId = guestUserData.id;
  }

  if (!userId) {
    throw new Error("User id was not created");
  }

  const finalUserId = userId;

  let createdCaseId: string | null = null;
  let createdAppointmentId: string | null = null;
  let createdTicketId: string | null = null;
  let claimedReferenceNumber: string | null = null;

  let claimedQueueId: string | null = null;
  let claimedTicketDigits: string | null = null;
  let claimedAppointmentSlot: AppointmentSlotClaim | null = null;
  let claimedQueuePositionLock: QueuePositionLock | null = null;

  let ticketFailure: SubmitEnquiryResult | null = null;
  let appointmentFailure: SubmitEnquiryResult | null = null;

  // Create a new case with the enquiry details, linked to the user and department
  try {
    const referenceNumber = await allocateCaseReferenceNumber();
    claimedReferenceNumber = referenceNumber;

    const caseCreateInput = removeIrrelevantValues({
      userId: finalUserId,
      departmentId: validated.departmentId,
      referenceNumber,
      status: "OPEN",

      enquiry: validated.enquiry,
      otherEnquiryText: validated.otherEnquiryText,
      childrenCount: validated.childrenCount,
      householdSize: validated.householdSize,
      ageRange: validated.ageRange,
      hasDisabilityOrSensory: validated.hasDisabilityOrSensory,
      disabilityType: validated.disabilityType,

      domesticAbuse: validated.domesticAbuse,
      safeToContact: validated.safeToContact,
      safeContactNotes: validated.safeContactNotes,

      urgent: validated.urgent,
      urgentReason: validated.urgentReason,
      urgentReasonOtherText: validated.urgentReasonOtherText,

      supportNeedsJson,
      supportNotes: validated.supportNotes,
      otherSupport: validated.otherSupport,

      additionalInfo: validated.additionalInfo,
    });

    const { data: caseData, errors: caseErrors } = await client.models.Case.create(
      caseCreateInput as CaseCreateInput,
    );

    if (caseErrors?.length || !caseData?.id) {
      logModelErrors("submitEnquiry: Case.create failed", caseErrors);
      throw new Error("Failed to create case");
    }

    createdCaseId = caseData.id;
    const caseId = createdCaseId;

    // If the user chose to book an appointment, create an appointment linked to the case
    if (validated.proceed === "BOOK_APPOINTMENT") {
      const appointmentSlot = {
        departmentId: validated.departmentId,
        dateIso: validated.appointmentDateIso!,
        time: validated.appointmentTime!,
      } satisfies AppointmentSlotClaim;

      try {
        // Attempt to claim the appointment slot to ensure it is not double-booked
        await claimAppointmentSlot(appointmentSlot);
        claimedAppointmentSlot = appointmentSlot;
      } catch (e: any) {
        const name = typeof e?.name === "string" ? e.name : "";

        if (name === "ConditionalCheckFailedException") {
          appointmentFailure = {
            ok: false,
            errorCode: "CONFLICT",
            errorMessage:
              "That appointment time is no longer available for this department. Please choose another slot.",
          };
          throw new Error("Appointment slot already claimed");
        }

        throw e;
      }

      const { data: apptData, errors: appointmentErrors } = await client.models.Appointment.create({
        caseId,
        userId: finalUserId,
        date: appointmentSlot.dateIso,
        time: appointmentSlot.time,
        status: "SCHEDULED",
        notes: null,
      });

      if (appointmentErrors?.length || !apptData?.id) {
        logModelErrors("submitEnquiry: Appointment.create failed", appointmentErrors);
        throw new Error("Failed to book appointment");
      }

      createdAppointmentId = apptData.id;
      // Appointment successfully created, now mark the slot as booked
      await markAppointmentSlotBooked(appointmentSlot);
      return { ok: true, referenceNumber };
    }

    const departmentCode = getDepartmentCode(validated.departmentId);
    const alloc = await allocateDeptTicketNumber(departmentCode);

    if (!alloc.ok) {
      ticketFailure = {
        ok: false,
        errorCode: alloc.errorCode,
        errorMessage: alloc.errorMessage,
      };
      throw new Error("Ticket allocation failed");
    }

    claimedQueueId = alloc.queueId;
    claimedTicketDigits = alloc.ticketDigits;

    claimedQueuePositionLock = await claimQueuePositionLock(validated.departmentId);
    const nextQueuePosition = await getNextQueuePosition(
      validated.departmentId,
      claimedQueuePositionLock.serviceDay,
    );

    // If not booking an appointment, create a ticket for the case.
    const { data: ticketData, errors: ticketErrors } = await client.models.Ticket.create({
      caseId: createdCaseId,
      departmentId: validated.departmentId,
      ticketNumber: alloc.ticketNumber,
      status: "WAITING",
      position: nextQueuePosition,
      estimatedWaitTimeLower: -1,
      estimatedWaitTimeUpper: -1,
    });

    if (ticketErrors?.length || !ticketData?.id) {
      logModelErrors("submitEnquiry: Ticket.create failed", ticketErrors);
      throw new Error("Failed to create ticket");
    }

    createdTicketId = ticketData.id;
    if (claimedQueuePositionLock) {
      await tryDelete("QueuePositionLock.delete", () =>
        releaseQueuePositionLock(claimedQueuePositionLock!),
      );
      claimedQueuePositionLock = null;
    }
    return { ok: true, referenceNumber, ticketNumber: alloc.ticketNumber };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("submitEnquiry: failed", {
      message: msg,
      createdGuestUserId: createdGuestUserId ?? undefined,
      createdCaseId: createdCaseId ?? undefined,
      createdAppointmentId: createdAppointmentId ?? undefined,
      createdTicketId: createdTicketId ?? undefined,
    });

    if (createdTicketId) {
      const ticketId = createdTicketId;
      await tryDelete("Ticket.delete", () => client.models.Ticket.delete({ id: ticketId }));
    }

    if (claimedQueueId && claimedTicketDigits) {
      const queueId = claimedQueueId;
      const ticketDigits = claimedTicketDigits;

      await tryDelete("TicketNumberClaims.delete", () =>
        releaseTicketNumber(queueId, ticketDigits),
      );
    }

    if (claimedQueuePositionLock) {
      await tryDelete("QueuePositionLock.delete", () =>
        releaseQueuePositionLock(claimedQueuePositionLock!),
      );
    }

    let appointmentDeleted = !createdAppointmentId;

    if (createdAppointmentId) {
      const appointmentId = createdAppointmentId;
      appointmentDeleted = await tryDelete("Appointment.delete", () =>
        client.models.Appointment.delete({ id: appointmentId }),
      );
    }

    if (claimedAppointmentSlot && appointmentDeleted) {
      const slot = claimedAppointmentSlot;
      await tryDelete("AppointmentSlotClaims.delete", () => releaseAppointmentSlot(slot));
    }

    let caseDeleted = !createdCaseId;

    if (createdCaseId) {
      const caseId = createdCaseId;
      caseDeleted = await tryDelete("Case.delete", () => client.models.Case.delete({ id: caseId }));
    }

    if (claimedReferenceNumber && caseDeleted) {
      const referenceNumber = claimedReferenceNumber;
      await tryDelete("CaseReferenceClaims.delete", () =>
        releaseCaseReferenceNumber(referenceNumber),
      );
    }

    if (createdGuestUserId) {
      const guestUserId = createdGuestUserId;
      await tryDelete("User.delete", () => client.models.User.delete({ id: guestUserId }));
    }

    if (ticketFailure) return ticketFailure;
    if (appointmentFailure) return appointmentFailure;

    return {
      ok: false,
      errorCode: "SERVER",
      errorMessage: "Submission failed. Please try again.",
    };
  }
};
