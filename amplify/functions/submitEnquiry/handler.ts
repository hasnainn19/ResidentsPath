import { randomBytes } from "crypto";
import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";
import { ref } from "process";

const DEPARTMENTS = [
  "Council Tax or Housing Benefit Help",
  "Homelessness",
  "Adults duty",
  "Childrens duty",
  "Community Hub Advisor",
  "General customer services",
] as const;

const PROCEED = ["Book appointment", "Join digital queue"] as const;

const CONTACT_METHOD = ["Text message", "Email"] as const;

const SAFE_TO_CONTACT = ["yes", "no", "prefer_not_to_say"] as const;

const PRONOUNS = ["He/him", "She/her", "They/them", "Other", "Prefer not to say"] as const;

const URGENT = ["yes", "no", "unsure"] as const;

const URGENT_REASON = [
  "Safety concern",
  "No safe place to stay tonight",
  "Health or mobility",
  "Time-limited today",
] as const;

const CHILDREN_COUNT = ["0", "1", "2", "3", "4", "5", "6+"] as const;

const DISABILITY_TYPE = [
  "Mobility impairment",
  "Visual impairment",
  "Hearing impairment",
  "Cognitive / learning",
  "Mental health",
  "Other",
  "Prefer not to say",
] as const;

const HOUSEHOLD_SIZE = ["1", "2", "3", "4", "5", "6+", "Prefer not to say"] as const;

const AGE_RANGE = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
  "Prefer not to say",
] as const;

const SUPPORT_NEEDS = [
  "ACCESSIBILITY",
  "LANGUAGE",
  "INTERPRETER",
  "SEATING",
  "WRITTEN_UPDATES",
  "LARGE_TEXT",
  "QUIET_SPACE",
  "BSL",
  "HELP_WITH_FORMS",
] as const;

const LIMIT = {
  SHORT: 70,
  MEDIUM: 100,
  LONG: 500,
  XLONG: 1000,
} as const;

const HYGIENE = {
  ENQUIRY_ID_MAX: 100,
  PHONE_MAX_CHARS: 30,
  PHONE_COUNTRY_MAX: 50,
} as const;

const ALLOWED_KEYS = new Set([
  "department",
  "enquiry",

  "proceed",
  "appointmentDateIso",
  "appointmentTime",

  "firstName",
  "middleName",
  "lastName",
  "preferredName",
  "pronouns",
  "pronounsOther",

  "addressLine1",
  "addressLine2",
  "addressLine3",
  "townOrCity",
  "postcode",

  "contactMethod",
  "email",
  "phone",
  "phoneCountry",

  "childrenCount",
  "householdSize",
  "ageRange",

  "hasDisabilityOrSensory",
  "disabilityType",

  "domesticAbuse",
  "safeToContact",
  "safeContactNotes",

  "urgent",
  "urgentReason",
  "urgentOtherReason",

  "supportNeeds",
  "supportNotes",
  "otherSupport",

  "otherEnquiryText",
  "additionalInfo",
]);

// Remove fields that are null, undefined, empty strings, or empty arrays/objects after cleaning
export function removeIrrelevantFields<T>(value: T): T | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : (trimmed as any);
  }

  if (Array.isArray(value)) {
    const filtered = value
      .map((item) => removeIrrelevantFields(item))
      .filter((item) => item !== undefined) as any;

    return filtered.length === 0 ? undefined : filtered;
  }

  if (typeof value === "object") {
    const obj: any = {};
    for (const [key, v] of Object.entries(value as any)) {
      const nestedValue = removeIrrelevantFields(v);
      if (nestedValue !== undefined) obj[key] = nestedValue;
    }
    return Object.keys(obj).length === 0 ? undefined : obj;
  }

  return value;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  assert(typeof value === "string", `${label} must be a string`);
  assert(value.trim().length > 0, `${label} is required`);
}

function assertMaxLen(value: string, maxLen: number, label: string) {
  assert(value.length <= maxLen, `${label} must be at most ${maxLen} characters`);
}

function assertOptionalStringMaxLen(value: unknown, maxLen: number, label: string) {
  if (value === undefined) return;
  assert(typeof value === "string", `${label} must be a string`);
  assertMaxLen(value, maxLen, label);
}

// Assert that value is one of the allowed strings (enums)
function assertOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  label: string,
): asserts value is T[number] {
  assert(typeof value === "string", `${label} must be a string`);
  assert(allowed.includes(value), `${label} is invalid`);
}

// Assert every item in the array is one of the allowed strings (enums)
function assertArrayOfOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  label: string,
): asserts value is Array<T[number]> {
  assert(Array.isArray(value), `${label} must be an array`);
  for (const item of value) {
    assertOneOf(item, allowed, `${label} item`);
  }
}

function assertNoUnknownKeys(obj: any) {
  for (const k of Object.keys(obj)) {
    assert(ALLOWED_KEYS.has(k), `Unknown field: ${k}`);
  }
}

function assertIsoDate(value: unknown, label: string): asserts value is string {
  assertNonEmptyString(value, label);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(value), `${label} must be YYYY-MM-DD`);

  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  const isValid =
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;

  assert(isValid, `${label} must be a real date`);
}

function assertTimeHHmm(value: unknown, label: string): asserts value is string {
  assertNonEmptyString(value, label);
  assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(value), `${label} must be HH:mm (00:00 to 23:59)`);
}

function assertEmail(value: unknown, label: string): asserts value is string {
  assertNonEmptyString(value, label);
  assertMaxLen(value, LIMIT.MEDIUM, label);
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), `${label} format is invalid`);
}

function assertPhone(value: unknown, label: string): asserts value is string {
  assertNonEmptyString(value, label);
  assertMaxLen(value, HYGIENE.PHONE_MAX_CHARS, label);
  assert(/^[0-9+().\-\s]+$/.test(value), `${label} contains invalid characters`);

  const digitsOnly = value.replace(/\D/g, "");
  assert(digitsOnly.length >= 7 && digitsOnly.length <= 15, `${label} must have 7 to 15 digits`);
}

function assertUniqueStrings(arr: string[], label: string) {
  const set = new Set(arr);
  assert(set.size === arr.length, `${label} must not contain duplicates`);
}


function assertEnquiryName(value: unknown) {
  assertNonEmptyString(value, "Enquiry");
  assertMaxLen(value, HYGIENE.ENQUIRY_ID_MAX, "Enquiry");
  assert(!/[\u0000-\u001F\u007F]/.test(value), "Enquiry contains invalid control characters");
  assert(!/[<>]/.test(value), "Enquiry contains invalid characters");
}

function validateProceed(cleanedInput: any) {
  assertOneOf(cleanedInput.proceed, PROCEED, "Proceed");

  // If booking an appointment, date and time are required and must be valid
  if (cleanedInput.proceed === "Book appointment") {
    assertIsoDate(cleanedInput.appointmentDateIso, "appointmentDateIso");
    assertTimeHHmm(cleanedInput.appointmentTime, "appointmentTime");
    return;
  }

  // If joining the queue, date and time must not be provided
  assert(cleanedInput.appointmentDateIso === undefined, "appointmentDateIso must not be provided for queue");
  assert(cleanedInput.appointmentTime === undefined, "appointmentTime must not be provided for queue");
}

function validatePronouns(cleanedInput: any) {
  if (cleanedInput.pronouns === undefined) {
    assert(
      cleanedInput.pronounsOther === undefined,
      "pronounsOther must not be provided unless pronouns is Other",
    );
    return;
  }

  assertOneOf(cleanedInput.pronouns, PRONOUNS, "Pronouns");

  if (cleanedInput.pronouns === "Other") {
    assertNonEmptyString(cleanedInput.pronounsOther, "pronounsOther");
    assertMaxLen(cleanedInput.pronounsOther, LIMIT.SHORT, "pronounsOther");
    return;
  }

  assert(cleanedInput.pronounsOther === undefined, "pronounsOther must not be provided unless pronouns is Other");
}

function validateDomesticAbuse(cleanedInput: any) {
  if (cleanedInput.domesticAbuse !== undefined) {
    assert(typeof cleanedInput.domesticAbuse === "boolean", "domesticAbuse must be a boolean");
  }

  if (cleanedInput.domesticAbuse !== true) {
    assert(cleanedInput.safeToContact === undefined, "safeToContact must not be provided unless domesticAbuse is true");
    assert(
      cleanedInput.safeContactNotes === undefined,
      "safeContactNotes must not be provided unless domesticAbuse is true",
    );
    return;
  }

  assertOneOf(cleanedInput.safeToContact, SAFE_TO_CONTACT, "safeToContact");

  if (cleanedInput.safeToContact === "no") {
    assertNonEmptyString(cleanedInput.safeContactNotes, "safeContactNotes");
    assertMaxLen(cleanedInput.safeContactNotes, LIMIT.XLONG, "safeContactNotes");
    return;
  }

  assert(
    cleanedInput.safeContactNotes === undefined,
    "safeContactNotes must only be provided when safeToContact is no",
  );
}

function validateUrgent(cleanedInput: any) {
  if (cleanedInput.urgent === undefined) return;

  assertOneOf(cleanedInput.urgent, URGENT, "urgent");

  if (cleanedInput.urgent !== "yes") {
    assert(cleanedInput.urgentReason === undefined, "urgentReason must not be provided unless urgent is yes");
    assert(
      cleanedInput.urgentOtherReason === undefined,
      "urgentOtherReason must not be provided unless urgent is yes",
    );
    return;
  }

  const hasReason = cleanedInput.urgentReason !== undefined;
  const hasOther = cleanedInput.urgentOtherReason !== undefined;

  assert(hasReason || hasOther, "urgentReason or urgentOtherReason is required when urgent is yes");

  if (hasReason) assertOneOf(cleanedInput.urgentReason, URGENT_REASON, "urgentReason");
  if (hasOther) {
    assertNonEmptyString(cleanedInput.urgentOtherReason, "urgentOtherReason");
    assertMaxLen(cleanedInput.urgentOtherReason, LIMIT.LONG, "urgentOtherReason");
  }
}

function validateDisability(cleanedInput: any) {
  assert(typeof cleanedInput.hasDisabilityOrSensory === "boolean", "hasDisabilityOrSensory must be a boolean");

  if (cleanedInput.hasDisabilityOrSensory === true && cleanedInput.disabilityType !== undefined) {
    assertOneOf(cleanedInput.disabilityType, DISABILITY_TYPE, "disabilityType");
    return;
  }

  assert(
    cleanedInput.disabilityType === undefined,
    "disabilityType must not be provided when hasDisabilityOrSensory is false",
  );
}

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalisePhone(value: string): string {
  return value.trim();
}

function normaliseUkPostcode(value: string): string {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

function assertUkPostcodeFormat(value: string, label: string) {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  const re =
    /^(GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/;
  assert(re.test(compact), `${label} format is invalid`);
}

function validateOptionals(cleanedInput: any) {
  assertOptionalStringMaxLen(cleanedInput.firstName, LIMIT.SHORT, "First name");
  assertOptionalStringMaxLen(cleanedInput.middleName, LIMIT.SHORT, "Middle name");
  assertOptionalStringMaxLen(cleanedInput.lastName, LIMIT.SHORT, "Last name");
  assertOptionalStringMaxLen(cleanedInput.preferredName, LIMIT.SHORT, "Preferred name");
  assertOptionalStringMaxLen(cleanedInput.addressLine1, LIMIT.MEDIUM, "Address line 1");
  assertOptionalStringMaxLen(cleanedInput.addressLine2, LIMIT.MEDIUM, "Address line 2");
  assertOptionalStringMaxLen(cleanedInput.addressLine3, LIMIT.MEDIUM, "Address line 3");
  assertOptionalStringMaxLen(cleanedInput.townOrCity, LIMIT.SHORT, "Town or city");

  if (cleanedInput.postcode !== undefined) {
    assert(typeof cleanedInput.postcode === "string", "Postcode must be a string");
    cleanedInput.postcode = normaliseUkPostcode(cleanedInput.postcode);
    assertMaxLen(cleanedInput.postcode, LIMIT.SHORT, "Postcode");
    assertUkPostcodeFormat(cleanedInput.postcode, "Postcode");
  }

  assertOptionalStringMaxLen(cleanedInput.otherEnquiryText, LIMIT.XLONG, "Describe your enquiry");
  assertOptionalStringMaxLen(cleanedInput.urgentOtherReason, LIMIT.LONG, "urgentOtherReason");
  assertOptionalStringMaxLen(cleanedInput.additionalInfo, LIMIT.XLONG, "additionalInfo");
  assertOptionalStringMaxLen(cleanedInput.supportNotes, LIMIT.LONG, "supportNotes");
  assertOptionalStringMaxLen(cleanedInput.otherSupport, LIMIT.LONG, "otherSupport");

  if (cleanedInput.childrenCount !== undefined) assertOneOf(cleanedInput.childrenCount, CHILDREN_COUNT, "childrenCount");
  if (cleanedInput.householdSize !== undefined) assertOneOf(cleanedInput.householdSize, HOUSEHOLD_SIZE, "householdSize");
  if (cleanedInput.ageRange !== undefined) assertOneOf(cleanedInput.ageRange, AGE_RANGE, "ageRange");

  if (cleanedInput.supportNeeds !== undefined) {
    let arr: string[];
    if (Array.isArray(cleanedInput.supportNeeds)) {
      assertArrayOfOneOf(cleanedInput.supportNeeds, SUPPORT_NEEDS, "supportNeeds");
      assert(cleanedInput.supportNeeds.length <= 6, "supportNeeds has too many items");
      assertUniqueStrings(cleanedInput.supportNeeds, "supportNeeds");
      arr = cleanedInput.supportNeeds;
    } else {
      assertOneOf(cleanedInput.supportNeeds, SUPPORT_NEEDS, "supportNeeds");
      arr = [cleanedInput.supportNeeds];
    }
    cleanedInput.supportNeedsJson = JSON.stringify(arr);
  } else {
    cleanedInput.supportNeedsJson = undefined;
  }
}

function validateContact(cleanedInput: any) {
  if (cleanedInput.email !== undefined) {
    assert(typeof cleanedInput.email === "string", "Email must be a string");
    cleanedInput.email = normaliseEmail(cleanedInput.email);
  }
  if (cleanedInput.phone !== undefined) {
    assert(typeof cleanedInput.phone === "string", "phone must be a string");
    cleanedInput.phone = normalisePhone(cleanedInput.phone);
  }
  if (cleanedInput.phoneCountry !== undefined) {
    assert(typeof cleanedInput.phoneCountry === "string", "phoneCountry must be a string");
    cleanedInput.phoneCountry = cleanedInput.phoneCountry.trim();
  }

  if (cleanedInput.contactMethod === undefined) {
    if (cleanedInput.email !== undefined) assertEmail(cleanedInput.email, "Email");
    if (cleanedInput.phone !== undefined) assertPhone(cleanedInput.phone, "phone");
    if (cleanedInput.phoneCountry !== undefined) {
      assertMaxLen(cleanedInput.phoneCountry, HYGIENE.PHONE_COUNTRY_MAX, "phoneCountry");
    }
    return;
  }

  assertOneOf(cleanedInput.contactMethod, CONTACT_METHOD, "contactMethod");

  if (cleanedInput.contactMethod === "Email") {
    assertEmail(cleanedInput.email, "Email");
    if (cleanedInput.phone !== undefined) assertPhone(cleanedInput.phone, "phone");
    if (cleanedInput.phoneCountry !== undefined) {
      assertMaxLen(cleanedInput.phoneCountry, HYGIENE.PHONE_COUNTRY_MAX, "phoneCountry");
    }
    return;
  }

  assertNonEmptyString(cleanedInput.phoneCountry, "phoneCountry");
  assertMaxLen(cleanedInput.phoneCountry, HYGIENE.PHONE_COUNTRY_MAX, "phoneCountry");
  assertPhone(cleanedInput.phone, "phone");

  if (cleanedInput.email !== undefined) assertEmail(cleanedInput.email, "Email");
}

function validateRequired(cleanedInput: any) {
  assertOneOf(cleanedInput.department, DEPARTMENTS, "Department");
  assertEnquiryName(cleanedInput.enquiry);
}

function logModelErrors(prefix: string, errors: any[] | undefined) {
  const safe =
    Array.isArray(errors) && errors.length
      ? errors.map((e) => ({
          message: typeof e?.message === "string" ? e.message.slice(0, 200) : "unknown",
          errorType: typeof e?.errorType === "string" ? e.errorType : undefined,
        }))
      : [];
  console.error(prefix, safe);
}

function cryptoRandomFrom(set: string, length: number): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += set[bytes[i] % set.length];
  }
  return result;
}

export function generateReferenceNumber(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const prefix = cryptoRandomFrom(letters, 3);
  const suffix = cryptoRandomFrom(chars, 6);

  return `${prefix}-${suffix}`;
}

export const handler: Schema["submitEnquiry"]["functionHandler"] = async (event) => {
  const { input } = event.arguments;
  const cleanedInput = removeIrrelevantFields(input) as any;

  assert(cleanedInput, "Input cannot be empty or only contain irrelevant fields");
  assertNoUnknownKeys(cleanedInput);

  validateRequired(cleanedInput);
  validateDisability(cleanedInput);
  validateProceed(cleanedInput);
  validatePronouns(cleanedInput);
  validateDomesticAbuse(cleanedInput);
  validateUrgent(cleanedInput);
  validateOptionals(cleanedInput);
  validateContact(cleanedInput);

  const client = generateClient<Schema>({
    authMode: "iam",
  });

  const identity = event.identity;

  const sub =
    identity && typeof identity === "object" && "sub" in identity
      ? (identity.sub as string)
      : null;

  let userId: string | null = null;
  let createdGuestUserId: string | null = null;

  if (sub) {
    try {
      const { data: users, errors } = await client.models.User.list({
        filter: { cognitoUserId: { eq: sub } },
        limit: 1,
      });

      if (!errors?.length && users && users.length > 0 && users[0]?.id) {
        userId = users[0].id;
      }
    } catch {
      console.error("submitEnquiry: user lookup failed");
    }
  }

  if (!userId) {
    const userCreateInput = removeIrrelevantFields({
      cognitoUserId: sub ?? undefined,

      firstName: cleanedInput.firstName,
      middleNames: cleanedInput.middleNames,
      lastName: cleanedInput.lastName,
      preferredName: cleanedInput.preferredName,

      email: cleanedInput.email,
      phoneNumber: cleanedInput.phone,

      addressLine1: cleanedInput.addressLine1,
      addressLine2: cleanedInput.addressLine2,
      addressLine3: cleanedInput.addressLine3,
      city: cleanedInput.townOrCity,
      postcode: cleanedInput.postcode,
    }) as any;

    const { data: guestUserData, errors: guestUserErrors } =
      await client.models.User.create(userCreateInput);

    if (guestUserErrors?.length || !guestUserData?.id) {
      logModelErrors("submitEnquiry: User.create failed", guestUserErrors);
      throw new Error("Failed to submit enquiry");
    }

    userId = guestUserData.id;
    createdGuestUserId = guestUserData.id;
  }

  let createdCaseId: string | null = null;
  let createdAppointmentId: string | null = null;
  let createdTicketId: string | null = null;

  try {
    const referenceNumber = generateReferenceNumber();

    const caseCreateInput = removeIrrelevantFields({
      userId,
      departmentId: cleanedInput.department,
      referenceNumber,
      status: "OPEN",

      enquiry: cleanedInput.enquiry,
      childrenCount: cleanedInput.childrenCount,
      householdSize: cleanedInput.householdSize,
      ageRange: cleanedInput.ageRange,
      hasDisabilityOrSensory: cleanedInput.hasDisabilityOrSensory,
      disabilityType: cleanedInput.disabilityType,

      domesticAbuse: cleanedInput.domesticAbuse,
      safeToContact: cleanedInput.safeToContact,
      safeContactNotes: cleanedInput.safeContactNotes,

      urgent: cleanedInput.urgent,
      urgentReason: cleanedInput.urgentReason,
      urgentOtherReason: cleanedInput.urgentOtherReason,

      supportNeedsJson: cleanedInput.supportNeedsJson,
      supportNotes: cleanedInput.supportNotes,
      otherSupport: cleanedInput.otherSupport,

      additionalInfo: cleanedInput.additionalInfo,
    }) as any;

    const { data: caseData, errors: caseErrors } =
      await client.models.Case.create(caseCreateInput);

    if (caseErrors?.length || !caseData?.id) {
      logModelErrors("submitEnquiry: Case.create failed", caseErrors);
      throw new Error("Failed to submit enquiry");
    }

    createdCaseId = caseData.id;

    if (cleanedInput.proceed === "Book appointment") {
      const { data: apptData, errors: appointmentErrors } =
        await client.models.Appointment.create({
          caseId: createdCaseId,
          userId,
          date: cleanedInput.appointmentDateIso,
          time: cleanedInput.appointmentTime,
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

    const { data: ticketData, errors: ticketErrors } = await client.models.Ticket.create({
      caseId: createdCaseId,
      ticketNumber: "-1",
      placement: -1,
      estimatedWaitTimeLower: -1,
      estimatedWaitTimeUpper: -1,
    });

    if (ticketErrors?.length || !ticketData?.id) {
      logModelErrors("submitEnquiry: Ticket.create failed", ticketErrors);
      throw new Error("Failed to submit enquiry");
    }

    createdTicketId = ticketData.id;

    return { referenceNumber };
  } catch (e) {
    try {
      if (createdTicketId) await client.models.Ticket.delete({ id: createdTicketId });
    } catch {
      console.error("submitEnquiry: cleanup Ticket.delete failed");
    }

    try {
      if (createdAppointmentId) await client.models.Appointment.delete({ id: createdAppointmentId });
    } catch {
      console.error("submitEnquiry: cleanup Appointment.delete failed");
    }

    try {
      if (createdCaseId) await client.models.Case.delete({ id: createdCaseId });
    } catch {
      console.error("submitEnquiry: cleanup Case.delete failed");
    }

    try {
      if (createdGuestUserId) await client.models.User.delete({ id: createdGuestUserId });
    } catch {
      console.error("submitEnquiry: cleanup User.delete failed");
    }

    throw e;
  }
};