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
import { getAmplifyClient } from "../utils/amplifyClient";
import { claimCaseReferenceNumber, releaseCaseReferenceNumber } from "../utils/enquiriesStateTable";
import {
  createAppointmentSubmission,
  createQueueSubmission,
  cleanupCreatedVisitResources,
  type CreatedVisitResourcesState,
  getErrorName,
} from "../utils/submissionShared";
import { getIdentityGroups, getIdentitySub } from "../utils/identityGroups";
import { logModelErrors, runCleanup, tryCleanup } from "../utils/runCleanup";
import { CASE_REFERENCE_CHARS, CASE_REFERENCE_LETTERS } from "../../../shared/referenceNumbers";

type DataClient = ReturnType<typeof generateClient<Schema>>;
type UserCreateInput = Parameters<DataClient["models"]["User"]["create"]>[0];
type UserUpdateInput = Parameters<DataClient["models"]["User"]["update"]>[0];
type CaseCreateInput = Parameters<DataClient["models"]["Case"]["create"]>[0];

type SubmitEnquiryErrorCode = "VALIDATION" | "CAPACITY" | "CONFLICT" | "SERVER";

type SubmitEnquiryResult = {
  ok: boolean;
  referenceNumber?: string;
  bookingReferenceNumber?: string;
  ticketNumber?: string;
  estimatedWaitTimeLower?: number;
  estimatedWaitTimeUpper?: number;
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

export function generateCaseReferenceNumber(): string {
  const prefix = cryptoRandomFrom(CASE_REFERENCE_LETTERS, 3);
  const suffix = cryptoRandomFrom(CASE_REFERENCE_CHARS, 6);

  return `${prefix}-${suffix}`;
}

// Attempt to allocate a unique case reference number by generating random reference numbers
// and trying to claim them until one succeeds or a maximum number of attempts is reached
// This avoids race conditions and ensures uniqueness without needing to query the database for existing reference numbers
async function allocateCaseReferenceNumber() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const referenceNumber = generateCaseReferenceNumber();

    try {
      await claimCaseReferenceNumber(referenceNumber);
      return referenceNumber;
    } catch (error: unknown) {
      const name = getErrorName(error);
      // If the error is a ConditionalCheckFailedException, it means the reference number is already claimed so continue the loop
      if (name === "ConditionalCheckFailedException") continue;
      throw error;
    }
  }

  throw new Error("Failed to allocate a unique case reference");
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
  const sub = getIdentitySub(identity);
  const identityGroups = getIdentityGroups(identity);
  const shouldCreateSeparateGuestUser =
    identityGroups.includes("Staff") || identityGroups.includes("HounslowHouseDevices");

  let userId: string | null = null;
  let createdGuestUserId: string | null = null;

  // Staff and Hounslow House device accounts can submit on behalf of residents, so keep
  // those submissions separate from the signed-in account and always create a guest user.
  // Residents can still reuse their linked account details when they are signed in.
  if (sub && !shouldCreateSeparateGuestUser) {
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
      id: shouldCreateSeparateGuestUser ? undefined : (sub ?? undefined),
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
  let claimedReferenceNumber: string | null = null;
  const createdVisitResources: CreatedVisitResourcesState = {
    createdTicketId: null,
    claimedQueueId: null,
    claimedTicketDigits: null,
    claimedQueuePositionKey: null,
    createdAppointmentId: null,
    claimedAppointmentSlot: null,
    claimedBookingReferenceNumber: null,
  };

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
      const appointmentResult = await createAppointmentSubmission({
        client,
        caseId,
        userId: finalUserId,
        departmentId: validated.departmentId,
        appointmentDateIso: validated.appointmentDateIso!,
        appointmentTime: validated.appointmentTime!,
        logPrefix: "submitEnquiry",
        visitState: createdVisitResources,
      });

      if (!appointmentResult.ok) {
        appointmentFailure = {
          ok: false,
          errorCode: appointmentResult.errorCode,
          errorMessage: appointmentResult.errorMessage,
        };
        throw new Error("Appointment slot already claimed");
      }

      return {
        ok: true,
        referenceNumber,
        bookingReferenceNumber: appointmentResult.bookingReferenceNumber,
      };
    }

    const queueResult = await createQueueSubmission({
      client,
      caseId,
      departmentId: validated.departmentId,
      logPrefix: "submitEnquiry",
      visitState: createdVisitResources,
    });

    if (!queueResult.ok) {
      ticketFailure = {
        ok: false,
        errorCode: queueResult.errorCode,
        errorMessage: queueResult.errorMessage,
      };
      throw new Error("Ticket allocation failed");
    }

    return {
      ok: true,
      referenceNumber,
      ticketNumber: queueResult.ticketNumber,
      estimatedWaitTimeLower: queueResult.estimatedWaitTimeLower,
      estimatedWaitTimeUpper: queueResult.estimatedWaitTimeUpper,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("submitEnquiry: failed", {
      message: msg,
      createdGuestUserId: createdGuestUserId ?? undefined,
      createdCaseId: createdCaseId ?? undefined,
      createdAppointmentId: createdVisitResources.createdAppointmentId ?? undefined,
      createdTicketId: createdVisitResources.createdTicketId ?? undefined,
    });

    await cleanupCreatedVisitResources(client, createdVisitResources, "submitEnquiry");

    let caseDeleted = !createdCaseId;

    if (createdCaseId) {
      const caseId = createdCaseId;
      caseDeleted = await tryCleanup("submitEnquiry: cleanup Case.delete failed", () =>
        runCleanup("submitEnquiry: Case.delete failed", `Failed to delete case ${caseId}`, () =>
          client.models.Case.delete({ id: caseId }),
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
