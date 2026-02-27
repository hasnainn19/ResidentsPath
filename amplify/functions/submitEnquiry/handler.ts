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
import { DepartmentLabelById, formSchema } from "../../../shared/formSchema";

type DataClient = ReturnType<typeof generateClient<Schema>>;
type DepartmentCreateInput = Parameters<DataClient["models"]["Department"]["create"]>[0];
type UserCreateInput = Parameters<DataClient["models"]["User"]["create"]>[0];
type CaseCreateInput = Parameters<DataClient["models"]["Case"]["create"]>[0];

let configured = false;

type AmplifyDataClientRuntimeEnv = {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_SESSION_TOKEN: string;
  AWS_REGION: string;
  AMPLIFY_DATA_DEFAULT_NAME: string;
};

async function ensureAmplifyConfigured() {
  if (configured) return;
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    process.env as unknown as AmplifyDataClientRuntimeEnv,
  );
  Amplify.configure(resourceConfig, libraryOptions);
  configured = true;
}

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

// Ensure the department exists in the database, creating it if it doesn't
async function ensureDepartmentExists(
  client: ReturnType<typeof generateClient<Schema>>,
  departmentId: string,
) {
  const { data: existing } = await client.models.Department.get({ id: departmentId });
  if (existing?.id) return;

  const name =
    DepartmentLabelById[departmentId as keyof typeof DepartmentLabelById] ?? departmentId;

  const createInput: DepartmentCreateInput = { id: departmentId, name } as DepartmentCreateInput;
  const { data: created, errors } = await client.models.Department.create(createInput);

  if (created?.id && !errors?.length) return;

  logModelErrors("submitEnquiry: Department.create failed", errors);
  throw new Error("Failed to create department");
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
  const validated = formSchema.parse(input);
  const supportNeedsJson = validated.supportNeeds
    ? JSON.stringify(validated.supportNeeds)
    : undefined;

  await ensureAmplifyConfigured();
  const client = generateClient<Schema>({ authMode: "iam" });

  const identity = event.identity;
  const sub =
    identity && typeof identity === "object" && "sub" in identity ? (identity.sub as string) : null;

  let userId: string | null = null;
  let createdGuestUserId: string | null = null;

  // If the user is logged in, try to find their account in the User model by their Cognito sub
  if (sub) {
    try {
      const { data: users, errors } = await client.models.User.list({
        filter: { cognitoUserId: { eq: sub } },
        limit: 1,
      });

      if (!errors?.length && users && users[0]?.id) {
        userId = users[0].id;
      }
    } catch (e) {
      console.error("submitEnquiry: user lookup failed", e);
    }
  }

  // If no user found, create a new guest user with the provided details
  if (!userId) {
    const userCreateInput = removeIrrelevantValues({
      cognitoUserId: sub ?? undefined,

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
      throw new Error("Failed to create guest user");
    }

    userId = guestUserData.id;
    createdGuestUserId = guestUserData.id;
  }

  let createdCaseId: string | null = null;
  let createdAppointmentId: string | null = null;
  let createdTicketId: string | null = null;

  // Create a new case with the enquiry details, linked to the user and department
  try {
    const referenceNumber = generateReferenceNumber();

    await ensureDepartmentExists(client, validated.departmentId);

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
      if (!validated.appointmentDateIso || !validated.appointmentTime) {
        throw new Error("Appointment date and time are required to book an appointment");
      }

      const { data: apptData, errors: appointmentErrors } = await client.models.Appointment.create({
        caseId: createdCaseId,
        userId,
        date: validated.appointmentDateIso,
        time: validated.appointmentTime,
        status: "SCHEDULED",
        notes: null,
      });

      if (appointmentErrors?.length || !apptData?.id) {
        logModelErrors("submitEnquiry: Appointment.create failed", appointmentErrors);
        throw new Error("Failed to book appointment");
      }

      createdAppointmentId = apptData.id;
      return { referenceNumber };
    }

    // If not booking an appointment, create a ticket for the case (Placeholders used for ticket fields)
    const { data: ticketData, errors: ticketErrors } = await client.models.Ticket.create({
      caseId: createdCaseId,
      ticketNumber: "-1",
      placement: -1,
      estimatedWaitTimeLower: -1,
      estimatedWaitTimeUpper: -1,
    });

    if (ticketErrors?.length || !ticketData?.id) {
      logModelErrors("submitEnquiry: Ticket.create failed", ticketErrors);
      throw new Error("Failed to create ticket");
    }

    createdTicketId = ticketData.id;
    return { referenceNumber };
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

    throw e;
  }
};
