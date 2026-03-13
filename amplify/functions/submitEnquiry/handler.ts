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
} from "@aws-sdk/client-dynamodb";
import { getAmplifyClient } from "../utils/amplifyClient";
import {
  claimAppointmentSlot,
  claimCaseReferenceNumber,
  claimQueuePosition,
  claimTicketDigits,
  daysFromNowInSeconds,
  getDate,
  getEnquiriesStateTableName,
  markAppointmentSlotBooked,
  releaseAppointmentSlot,
  releaseCaseReferenceNumber,
  releaseQueuePosition,
  releaseTicketNumber,
  type AppointmentSlotClaim,
} from "../utils/enquiriesStateTable";
import {
  logModelErrors,
  runCleanup,
  tryCleanup,
} from "../utils/runCleanup";
import { DepartmentCodeById } from "../../../shared/departmentCodes";

type DataClient = ReturnType<typeof generateClient<Schema>>;
type UserCreateInput = Parameters<DataClient["models"]["User"]["create"]>[0];
type UserUpdateInput = Parameters<DataClient["models"]["User"]["update"]>[0];
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

function getTicketCounterKey(queueId: string) {
  return {
    pk: `QUEUE#${queueId}`,
    sk: "COUNTER",
  };
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

type DepartmentId = ReturnType<typeof formSchema.parse>["departmentId"];

function getDepartmentCode(departmentId: DepartmentId): string {
  const code = DepartmentCodeById[departmentId];
  if (!code) throw new Error(`No department code configured for ${departmentId}`);
  return code;
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
          } as UserUpdateInput);

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
  let claimedQueuePositionKey: string | null = null;
  let claimedAppointmentSlot: AppointmentSlotClaim | null = null;

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

    claimedQueuePositionKey = `${getDate()}#${validated.departmentId}`;
    const nextQueuePosition = await claimQueuePosition(claimedQueuePositionKey);

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
      await tryCleanup("submitEnquiry: cleanup Ticket.delete failed", () =>
        runCleanup(
          "submitEnquiry: Ticket.delete failed",
          `Failed to delete ticket ${ticketId}`,
          () => client.models.Ticket.delete({ id: ticketId }),
        ),
      );
    }

    if (claimedQueueId && claimedTicketDigits) {
      const queueId = claimedQueueId;
      const ticketDigits = claimedTicketDigits;

      await tryCleanup("submitEnquiry: cleanup TicketNumberClaims.delete failed", () =>
        releaseTicketNumber(queueId, ticketDigits),
      );
    }

    if (claimedQueuePositionKey && !createdTicketId) {
      const queuePositionKey = claimedQueuePositionKey;
      await tryCleanup("submitEnquiry: cleanup QueuePositionCounter.update failed", () =>
        releaseQueuePosition(queuePositionKey),
      );
    }

    let appointmentDeleted = !createdAppointmentId;

    if (createdAppointmentId) {
      const appointmentId = createdAppointmentId;
      appointmentDeleted = await tryCleanup("submitEnquiry: cleanup Appointment.delete failed", () =>
        runCleanup(
          "submitEnquiry: Appointment.delete failed",
          `Failed to delete appointment ${appointmentId}`,
          () => client.models.Appointment.delete({ id: appointmentId }),
        ),
      );
    }

    if (claimedAppointmentSlot && appointmentDeleted) {
      const slot = claimedAppointmentSlot;
      await tryCleanup("submitEnquiry: cleanup AppointmentSlotClaims.delete failed", () =>
        releaseAppointmentSlot(slot),
      );
    }

    let caseDeleted = !createdCaseId;

    if (createdCaseId) {
      const caseId = createdCaseId;
      caseDeleted = await tryCleanup("submitEnquiry: cleanup Case.delete failed", () =>
        runCleanup(
          "submitEnquiry: Case.delete failed",
          `Failed to delete case ${caseId}`,
          () => client.models.Case.delete({ id: caseId }),
        ),
      );
    }

    if (claimedReferenceNumber && caseDeleted) {
      const referenceNumber = claimedReferenceNumber;
      await tryCleanup("submitEnquiry: cleanup CaseReferenceClaims.delete failed", () =>
        releaseCaseReferenceNumber(referenceNumber),
      );
    }

    if (createdGuestUserId) {
      const guestUserId = createdGuestUserId;
      await tryCleanup("submitEnquiry: cleanup User.delete failed", () =>
        runCleanup(
          "submitEnquiry: User.delete failed",
          `Failed to delete user ${guestUserId}`,
          () => client.models.User.delete({ id: guestUserId }),
        ),
      );
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
