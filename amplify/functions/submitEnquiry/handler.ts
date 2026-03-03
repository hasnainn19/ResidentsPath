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
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { formSchema } from "../../../shared/formSchema";
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import {getAmplifyClient} from "../utils/amplifyClient";

type DataClient = ReturnType<typeof generateClient<Schema>>;
type UserCreateInput = Parameters<DataClient["models"]["User"]["create"]>[0];
type CaseCreateInput = Parameters<DataClient["models"]["Case"]["create"]>[0];

type SubmitEnquiryErrorCode = "VALIDATION" | "CAPACITY" | "SERVER";

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

  const safe = errors.map((e: any) => ({
    message: typeof e?.message === "string" ? e.message.slice(0, 200) : "unknown",
    errorType: typeof e?.errorType === "string" ? e.errorType : undefined,
  }));
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

// Atomically increment and retrieve the next ticket index for a queue from DynamoDB, ensuring uniqueness without race conditions
async function getNextTicketIndex(queueId: string): Promise<number> {
  const tableName = process.env.TICKET_COUNTER_TABLE;
  if (!tableName) throw new Error("TICKET_COUNTER_TABLE is not set");

  const res = await ddb.send(
    new UpdateItemCommand({
      TableName: tableName,
      Key: { counterId: { S: queueId } },
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

// Attempt to claim a ticket number for a queue by inserting a record into the ticket number claims table
// If the record already exists, it means another process has claimed that ticket number, so try the next one
async function claimTicketDigits(queueId: string, ticketNumber: string) {
  const claimsTable = process.env.TICKET_NUMBER_CLAIMS_TABLE;
  if (!claimsTable) throw new Error("TICKET_NUMBER_CLAIMS_TABLE is not set");

  await ddb.send(
    new PutItemCommand({
      TableName: claimsTable,
      Item: {
        queueId: { S: queueId },
        ticketNumber: { S: ticketNumber },
        allocatedAt: { N: String(Date.now()) },
        expiresAt: { N: String(daysFromNowInSeconds(3)) },
      },
      ConditionExpression: "attribute_not_exists(queueId) AND attribute_not_exists(ticketNumber)",
    }),
  );
}

// Release a claimed ticket number by deleting the corresponding record from the ticket number claims table
async function releaseTicketNumber(queueId: string, ticketNumber: string) {
  const claimsTable = process.env.TICKET_NUMBER_CLAIMS_TABLE;
  if (!claimsTable) return;

  await ddb.send(
    new DeleteItemCommand({
      TableName: claimsTable,
      Key: {
        queueId: { S: queueId },
        ticketNumber: { S: ticketNumber },
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

    email: validated.email,
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`submitEnquiry: cleanup ${label} failed`, msg);
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

  await getAmplifyClient(); 
  const client = generateClient<Schema>({ authMode: "iam" });

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
        const new_info = updateUserInfo(validated);
        if (Object.keys(new_info).length) {
          const { errors: updateErrors } = await client.models.User.update({
            id: userId,
            ...new_info,
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

  let createdCaseId: string | null = null;
  let createdAppointmentId: string | null = null;
  let createdTicketId: string | null = null;

  let claimedQueueId: string | null = null;
  let claimedTicketDigits: string | null = null;

  let ticketFailure: SubmitEnquiryResult | null = null;

  // Create a new case with the enquiry details, linked to the user and department
  try {
    const referenceNumber = generateReferenceNumber();

    const caseCreateInput = removeIrrelevantValues({
      userId,
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

    // If the user chose to book an appointment, create an appointment linked to the case
    if (validated.proceed === "BOOK_APPOINTMENT") {
      const { data: apptData, errors: appointmentErrors } = await client.models.Appointment.create({
        caseId: createdCaseId,
        userId,
        date: validated.appointmentDateIso!,
        time: validated.appointmentTime!,
        status: "SCHEDULED",
        notes: null,
      });

      if (appointmentErrors?.length || !apptData?.id) {
        logModelErrors("submitEnquiry: Appointment.create failed", appointmentErrors);
        throw new Error("Failed to book appointment");
      }

      createdAppointmentId = apptData.id;
      return { ok: true, referenceNumber: referenceNumber };
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

    // If not booking an appointment, create a ticket for the case (Placeholders used for ticket fields)
    const { data: ticketData, errors: ticketErrors } = await client.models.Ticket.create({
      caseId: createdCaseId,
      ticketNumber: alloc.ticketNumber,
      placement: -1,
      estimatedWaitTimeLower: -1,
      estimatedWaitTimeUpper: -1,
    });

    if (ticketErrors?.length || !ticketData?.id) {
      logModelErrors("submitEnquiry: Ticket.create failed", ticketErrors);
      throw new Error("Failed to create ticket");
    }

    createdTicketId = ticketData.id;
    return { ok: true, referenceNumber: referenceNumber, ticketNumber: alloc.ticketNumber };
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
      await tryDelete("Ticket.delete", () => client.models.Ticket.delete({ id: createdTicketId! }));
    }

    // If a ticket number was claimed but failed later, release it so it can be reused
    if (claimedQueueId && claimedTicketDigits) {
      await tryDelete("TicketNumberClaims.delete", () =>
        releaseTicketNumber(claimedQueueId!, claimedTicketDigits!),
      );
    }

    if (createdAppointmentId) {
      await tryDelete("Appointment.delete", () =>
        client.models.Appointment.delete({ id: createdAppointmentId! }),
      );
    }
    if (createdCaseId) {
      await tryDelete("Case.delete", () => client.models.Case.delete({ id: createdCaseId! }));
    }
    if (createdGuestUserId) {
      await tryDelete("User.delete", () => client.models.User.delete({ id: createdGuestUserId! }));
    }

    if (ticketFailure) return ticketFailure;

    return {
      ok: false,
      errorCode: "SERVER",
      errorMessage: "Submission failed. Please try again.",
    };
  }
};
