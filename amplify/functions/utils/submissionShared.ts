import { randomBytes } from "crypto";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { generateClient } from "aws-amplify/data";

import type { Schema } from "../../data/resource";
import { DepartmentCodeByName } from "../../../shared/departmentCodes";
import {
  BOOKING_REFERENCE_DIGITS,
  BOOKING_REFERENCE_LETTERS,
  BOOKING_REFERENCE_PREFIX,
} from "../../../shared/referenceNumbers";
import type { AmplifyClient } from "./amplifyClient";
import {
  claimAppointmentSlot,
  releaseAppointmentSlot,
  releaseBookingReferenceNumber,
  releaseQueuePosition,
  releaseTicketNumber,
  claimBookingReferenceNumber,
  claimQueuePosition,
  claimTicketDigits,
  daysFromNowInSeconds,
  getDate,
  getEnquiriesStateTableName,
  markAppointmentSlotBooked,
  type AppointmentSlotClaim,
} from "./enquiriesStateTable";
import { getDefaultEstimatedWaitingTime, getEstimatedWaitTimeBounds } from "./queueWaitTimes";
import { logModelErrors, runCleanup, tryCleanup } from "./runCleanup";

const ddb = new DynamoDBClient({});

type DataClient = ReturnType<typeof generateClient<Schema>>;
type CaseUpdateCreateInput = Parameters<DataClient["models"]["CaseUpdate"]["create"]>[0];

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

export type CreatedVisitResourcesState = {
  createdTicketId: string | null;
  claimedQueueId: string | null;
  claimedTicketDigits: string | null;
  claimedQueuePositionKey: string | null;
  createdAppointmentId: string | null;
  claimedAppointmentSlot: AppointmentSlotClaim | null;
  claimedBookingReferenceNumber: string | null;
};

type CreateAppointmentSubmissionInput = {
  client: AmplifyClient;
  caseId: string;
  userId: string;
  departmentName: string;
  appointmentDateIso: string;
  appointmentTime: string;
  logPrefix: string;
  visitState: CreatedVisitResourcesState;
};

type CreateQueueSubmissionInput = {
  client: AmplifyClient;
  caseId: string;
  departmentName: string;
  logPrefix: string;
  visitState: CreatedVisitResourcesState;
};

type CreateCaseUpdateInput = {
  client: AmplifyClient;
  caseId: string;
  content: string;
  logPrefix: string;
};

export const APPOINTMENT_SLOT_UNAVAILABLE_MESSAGE =
  "That appointment time is no longer available for this department. Please choose another slot.";
export const RESIDENT_CASE_APPOINTMENT_LIMIT = 2;

function getTicketCounterKey(queueId: string) {
  return {
    pk: `QUEUE#${queueId}`,
    sk: "COUNTER",
  };
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

export function getErrorName(error: unknown) {
  if (!error || typeof error !== "object" || !("name" in error)) {
    return "";
  }

  return typeof error.name === "string" ? error.name : "";
}

function generateBookingReferenceNumber(): string {
  const letters = cryptoRandomFrom(BOOKING_REFERENCE_LETTERS, 3);
  const digits = cryptoRandomFrom(BOOKING_REFERENCE_DIGITS, 3);

  return `${BOOKING_REFERENCE_PREFIX}-${letters}${digits}`;
}

export async function allocateBookingReferenceNumber() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const referenceNumber = generateBookingReferenceNumber();

    try {
      await claimBookingReferenceNumber(referenceNumber);
      return referenceNumber;
    } catch (error: unknown) {
      if (getErrorName(error) === "ConditionalCheckFailedException") {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to allocate a unique booking reference");
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

// Atomically allocate a unique 3 digit ticket number for the current service day and department
// TicketNumber is in the form "X000" where X represents the first (or first two) letter(s) of the department and 000 is a zero-padded number from 000 to 999
export async function allocateDeptTicketNumber(
  departmentName: string,
): Promise<AllocateDeptTicketNumberResult> {
  const departmentCode = DepartmentCodeByName[departmentName as keyof typeof DepartmentCodeByName];
  if (!departmentCode) {
    throw new Error(`No department code configured for ${departmentName}`);
  }

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
    } catch (error: unknown) {
      // If the error is a ConditionalCheckFailedException, it means the ticket number is already claimed so continue the loop
      if (getErrorName(error) === "ConditionalCheckFailedException") {
        continue;
      }

      throw error;
    }
  }

  return {
    ok: false,
    errorCode: "CAPACITY",
    errorMessage: "The queue is currently at capacity. Please try again later.",
  };
}

export async function createCaseUpdate(input: CreateCaseUpdateInput) {
  const { data, errors } = await input.client.models.CaseUpdate.create({
    caseId: input.caseId,
    content: input.content,
  } as CaseUpdateCreateInput);

  if (errors?.length || !data?.id) {
    logModelErrors(`${input.logPrefix}: CaseUpdate.create failed`, errors);
    throw new Error("Failed to create case update");
  }

  return data.id;
}

export async function getCaseAppointmentCount(
  client: AmplifyClient,
  caseId: string,
  logPrefix: string,
) {
  const appointmentLookup = await client.models.Appointment.listAppointmentByCaseId({
    caseId,
  });

  if (appointmentLookup.errors?.length) {
    logModelErrors(
      `${logPrefix}: Appointment.listAppointmentByCaseId failed`,
      appointmentLookup.errors,
    );
    return null;
  }

  const appointments = (appointmentLookup.data ?? []).filter(
    (appointment) => appointment?.status === "SCHEDULED",
  );

  return appointments.length;
}

export async function createAppointmentSubmission(input: CreateAppointmentSubmissionInput): Promise<
  | {
      ok: true;
      bookingReferenceNumber: string;
    }
  | {
      ok: false;
      errorCode: "CONFLICT";
      errorMessage: string;
    }
> {
  const appointmentSlot: AppointmentSlotClaim = {
    departmentName: input.departmentName,
    dateIso: input.appointmentDateIso,
    time: input.appointmentTime,
  };
  const bookingReferenceNumber = await allocateBookingReferenceNumber();
  input.visitState.claimedBookingReferenceNumber = bookingReferenceNumber;

  try {
    // Attempt to claim the appointment slot to ensure it is not double-booked
    await claimAppointmentSlot(appointmentSlot);
    input.visitState.claimedAppointmentSlot = appointmentSlot;
  } catch (error: unknown) {
    if (getErrorName(error) === "ConditionalCheckFailedException") {
      return {
        ok: false,
        errorCode: "CONFLICT",
        errorMessage: APPOINTMENT_SLOT_UNAVAILABLE_MESSAGE,
      };
    }

    throw error;
  }

  const { data, errors } = await input.client.models.Appointment.create({
    caseId: input.caseId,
    userId: input.userId,
    bookingReferenceNumber,
    date: appointmentSlot.dateIso,
    time: appointmentSlot.time,
    status: "SCHEDULED",
    notes: null,
  });

  if (errors?.length || !data?.id) {
    logModelErrors(`${input.logPrefix}: Appointment.create failed`, errors);
    throw new Error("Failed to book appointment");
  }

  input.visitState.createdAppointmentId = data.id;
  // Appointment successfully created, now mark the slot as booked
  await markAppointmentSlotBooked(appointmentSlot);

  return {
    ok: true,
    bookingReferenceNumber,
  };
}

export async function createQueueSubmission(input: CreateQueueSubmissionInput): Promise<
  | {
      ok: true;
      ticketNumber: string;
      estimatedWaitTimeLower: number;
      estimatedWaitTimeUpper: number;
    }
  | {
      ok: false;
      errorCode: "CAPACITY";
      errorMessage: string;
    }
> {
  const alloc = await allocateDeptTicketNumber(input.departmentName);

  if (!alloc.ok) {
    return alloc;
  }

  input.visitState.claimedQueueId = alloc.queueId;
  input.visitState.claimedTicketDigits = alloc.ticketDigits;

  input.visitState.claimedQueuePositionKey = `${getDate()}#${input.departmentName}`;
  const nextQueuePosition = await claimQueuePosition(input.visitState.claimedQueuePositionKey);
  let estimatedWaitingTime = getDefaultEstimatedWaitingTime();

  try {
    const { data: department, errors: departmentErrors } = await input.client.models.Department.get({
      id: input.departmentName,
    });

    if (departmentErrors?.length) {
      logModelErrors(`${input.logPrefix}: Department.get failed`, departmentErrors);
    }

    estimatedWaitingTime =
      department?.estimatedWaitingTime ?? getDefaultEstimatedWaitingTime(department?.name);
  } catch (error) {
    console.error(`${input.logPrefix}: Department.get failed`, error);
  }

  const waitTimes = getEstimatedWaitTimeBounds(nextQueuePosition, estimatedWaitingTime);

  // If not booking an appointment, create a ticket for the case.
  const { data, errors } = await input.client.models.Ticket.create({
    caseId: input.caseId,
    departmentName: input.departmentName,
    ticketNumber: alloc.ticketNumber,
    status: "WAITING",
    position: nextQueuePosition,
    estimatedWaitTimeLower: waitTimes.lower,
    estimatedWaitTimeUpper: waitTimes.upper,
  });

  if (errors?.length || !data?.id) {
    logModelErrors(`${input.logPrefix}: Ticket.create failed`, errors);
    throw new Error("Failed to create ticket");
  }

  input.visitState.createdTicketId = data.id;

  return {
    ok: true,
    ticketNumber: alloc.ticketNumber,
    estimatedWaitTimeLower: waitTimes.lower,
    estimatedWaitTimeUpper: waitTimes.upper,
  };
}

export async function cleanupCreatedVisitResources(
  client: AmplifyClient,
  input: CreatedVisitResourcesState,
  logPrefix: string,
) {
  let ticketDeleted = !input.createdTicketId;

  if (input.createdTicketId) {
    const ticketId = input.createdTicketId;
    ticketDeleted = await tryCleanup(`${logPrefix}: cleanup Ticket.delete failed`, () =>
      runCleanup(`${logPrefix}: Ticket.delete failed`, `Failed to delete ticket ${ticketId}`, () =>
        client.models.Ticket.delete({ id: ticketId }),
      ),
    );
  }

  if (input.claimedQueueId && input.claimedTicketDigits) {
    const queueId = input.claimedQueueId;
    const ticketDigits = input.claimedTicketDigits;

    await tryCleanup(`${logPrefix}: cleanup TicketNumberClaims.delete failed`, () =>
      releaseTicketNumber(queueId, ticketDigits),
    );
  }

  if (input.claimedQueuePositionKey && ticketDeleted) {
    const queuePositionKey = input.claimedQueuePositionKey;

    await tryCleanup(`${logPrefix}: cleanup QueuePositionCounter.update failed`, () =>
      releaseQueuePosition(queuePositionKey),
    );
  }

  let appointmentDeleted = !input.createdAppointmentId;

  if (input.createdAppointmentId) {
    const appointmentId = input.createdAppointmentId;
    appointmentDeleted = await tryCleanup(`${logPrefix}: cleanup Appointment.delete failed`, () =>
      runCleanup(
        `${logPrefix}: Appointment.delete failed`,
        `Failed to delete appointment ${appointmentId}`,
        () => client.models.Appointment.delete({ id: appointmentId }),
      ),
    );
  }

  if (input.claimedAppointmentSlot && appointmentDeleted) {
    const slot = input.claimedAppointmentSlot;

    await tryCleanup(`${logPrefix}: cleanup AppointmentSlotClaims.delete failed`, () =>
      releaseAppointmentSlot(slot),
    );
  }

  if (input.claimedBookingReferenceNumber && appointmentDeleted) {
    const bookingReferenceNumber = input.claimedBookingReferenceNumber;

    await tryCleanup(`${logPrefix}: cleanup BookingReferenceClaims.delete failed`, () =>
      releaseBookingReferenceNumber(bookingReferenceNumber),
    );
  }
}
