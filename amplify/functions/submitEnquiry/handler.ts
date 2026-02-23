import { randomBytes } from "crypto";
import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/submitEnquiry";

let configured = false;

async function ensureAmplifyConfigured() {
  if (configured) return;
  const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  configured = true;
}

const DEPARTMENTS = [
  "COUNCIL_TAX_OR_HOUSING_BENEFIT_HELP",
  "HOMELESSNESS",
  "ADULTS_DUTY",
  "CHILDRENS_DUTY",
  "COMMUNITY_HUB_ADVISOR",
  "GENERAL_CUSTOMER_SERVICES",
] as const;

const PROCEED = ["BOOK_APPOINTMENT", "JOIN_DIGITAL_QUEUE"] as const;

const CONTACT_METHOD = ["TEXT_MESSAGE", "EMAIL"] as const;

const SAFE_TO_CONTACT = ["yes", "no", "prefer_not_to_say"] as const;

const PRONOUNS = ["", "HE_HIM", "SHE_HER", "THEY_THEM", "OTHER", "PREFER_NOT_TO_SAY"] as const;

const URGENT = ["yes", "no", "unsure"] as const;

const URGENT_REASON = [
  "SAFETY_CONCERN",
  "NO_SAFE_PLACE_TO_STAY_TONIGHT",
  "HEALTH_OR_MOBILITY",
  "TIME_LIMITED_TODAY",
] as const;

const CHILDREN_COUNT = ["0", "1", "2", "3", "4", "5", "6+"] as const;

const DISABILITY_TYPE = [
  "MOBILITY_IMPAIRMENT",
  "VISUAL_IMPAIRMENT",
  "HEARING_IMPAIRMENT",
  "COGNITIVE_LEARNING",
  "MENTAL_HEALTH",
  "OTHER",
  "PREFER_NOT_TO_SAY",
] as const;

const HOUSEHOLD_SIZE = ["1", "2", "3", "4", "5", "6+", "PREFER_NOT_TO_SAY"] as const;


const AGE_RANGE = [
  "UNDER_18",
  "AGE_18_24",
  "AGE_25_34",
  "AGE_35_44",
  "AGE_45_54",
  "AGE_55_64",
  "AGE_65_PLUS",
  "PREFER_NOT_TO_SAY",
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

const LABEL = {
  DEPARTMENT: "Department",
  ENQUIRY: "Enquiry",
  PROCEED: "Proceed",
  APPOINTMENT_DATE: "appointmentDateIso",
  APPOINTMENT_TIME: "appointmentTime",
  PRONOUNS: "Pronouns",
  PRONOUNS_OTHER: "pronounsOther",
  DOMESTIC_ABUSE: "domesticAbuse",
  SAFE_TO_CONTACT: "safeToContact",
  SAFE_CONTACT_NOTES: "safeContactNotes",
  URGENT: "urgent",
  URGENT_REASON: "urgentReason",
  URGENT_OTHER_REASON: "urgentOtherReason",
  CONTACT_METHOD: "contactMethod",
  EMAIL: "Email",
  PHONE: "Phone",
  PHONE_COUNTRY: "Phone country",
  POSTCODE: "Postcode",
  SUPPORT_NEEDS: "supportNeeds",
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

function assertOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  label: string,
): asserts value is T[number] {
  assert(typeof value === "string", `${label} must be a string`);
  assert(allowed.includes(value), `${label} is invalid`);
}

function assertArrayOfOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  label: string,
): asserts value is Array<T[number]> {
  assert(Array.isArray(value), `${label} must be an array`);
  for (let i = 0; i < value.length; i++) {
    assertOneOf(value[i], allowed, `${label}[${i}]`);
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
  const isValid = dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;

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
  assertNonEmptyString(value, LABEL.ENQUIRY);
  assertMaxLen(value, HYGIENE.ENQUIRY_ID_MAX, LABEL.ENQUIRY);
  assert(!/[\u0000-\u001F\u007F]/.test(value), "Enquiry contains invalid control characters");
  assert(!/[<>]/.test(value), "Enquiry contains invalid characters");
}

function validateProceed(cleanedInput: any) {
  assertOneOf(cleanedInput.proceed, PROCEED, LABEL.PROCEED);

  if (cleanedInput.proceed === "Book appointment") {
    assertIsoDate(cleanedInput.appointmentDateIso, LABEL.APPOINTMENT_DATE);
    assertTimeHHmm(cleanedInput.appointmentTime, LABEL.APPOINTMENT_TIME);
    return;
  }

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

  assertOneOf(cleanedInput.pronouns, PRONOUNS, LABEL.PRONOUNS);

  if (cleanedInput.pronouns === "Other") {
    assertNonEmptyString(cleanedInput.pronounsOther, LABEL.PRONOUNS_OTHER);
    assertMaxLen(cleanedInput.pronounsOther, LIMIT.SHORT, LABEL.PRONOUNS_OTHER);
    return;
  }

  assert(
    cleanedInput.pronounsOther === undefined,
    "pronounsOther must not be provided unless pronouns is Other",
  );
}

function validateDomesticAbuse(cleanedInput: any) {
  if (cleanedInput.domesticAbuse !== undefined) {
    assert(typeof cleanedInput.domesticAbuse === "boolean", `${LABEL.DOMESTIC_ABUSE} must be a boolean`);
  }

  if (cleanedInput.domesticAbuse !== true) {
    assert(
      cleanedInput.safeToContact === undefined,
      "safeToContact must not be provided unless domesticAbuse is true",
    );
    assert(
      cleanedInput.safeContactNotes === undefined,
      "safeContactNotes must not be provided unless domesticAbuse is true",
    );
    return;
  }

  assertOneOf(cleanedInput.safeToContact, SAFE_TO_CONTACT, LABEL.SAFE_TO_CONTACT);

  if (cleanedInput.safeToContact === "no") {
    assertNonEmptyString(cleanedInput.safeContactNotes, LABEL.SAFE_CONTACT_NOTES);
    assertMaxLen(cleanedInput.safeContactNotes, LIMIT.XLONG, LABEL.SAFE_CONTACT_NOTES);
    return;
  }

  assert(
    cleanedInput.safeContactNotes === undefined,
    "safeContactNotes must only be provided when safeToContact is no",
  );
}

function validateUrgent(cleanedInput: any) {
  if (cleanedInput.urgent === undefined) return;

  assertOneOf(cleanedInput.urgent, URGENT, LABEL.URGENT);

  if (cleanedInput.urgent !== "yes") {
    assert(cleanedInput.urgentReason === undefined, "urgentReason must not be provided unless urgent is yes");
    assert(cleanedInput.urgentOtherReason === undefined, "urgentOtherReason must not be provided unless urgent is yes");
    return;
  }

  const hasReason = cleanedInput.urgentReason !== undefined;
  const hasOther = cleanedInput.urgentOtherReason !== undefined;

  assert(hasReason || hasOther, "urgentReason or urgentOtherReason is required when urgent is yes");

  if (hasReason) assertOneOf(cleanedInput.urgentReason, URGENT_REASON, LABEL.URGENT_REASON);
  if (hasOther) {
    assertNonEmptyString(cleanedInput.urgentOtherReason, LABEL.URGENT_OTHER_REASON);
    assertMaxLen(cleanedInput.urgentOtherReason, LIMIT.LONG, LABEL.URGENT_OTHER_REASON);
  }
}

function validateDisability(cleanedInput: any) {
  if (cleanedInput.hasDisabilityOrSensory === undefined) {
    assert(
      cleanedInput.disabilityType === undefined,
      "disabilityType must not be provided when hasDisabilityOrSensory is missing",
    );
    return;
  }

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
  const re = /^(GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/;
  assert(re.test(compact), `${label} format is invalid`);
}

function normaliseInput(cleanedInput: any) {
  const out = { ...cleanedInput };

  if (out.email !== undefined) {
    assert(typeof out.email === "string", `${LABEL.EMAIL} must be a string`);
    out.email = normaliseEmail(out.email);
  }

  if (out.phone !== undefined) {
    assert(typeof out.phone === "string", `${LABEL.PHONE} must be a string`);
    out.phone = normalisePhone(out.phone);
  }

  if (out.phoneCountry !== undefined) {
    assert(typeof out.phoneCountry === "string", `${LABEL.PHONE_COUNTRY} must be a string`);
    out.phoneCountry = out.phoneCountry.trim();
  }

  if (out.postcode !== undefined) {
    assert(typeof out.postcode === "string", `${LABEL.POSTCODE} must be a string`);
    out.postcode = normaliseUkPostcode(out.postcode);
  }

  return out;
}

function getSupportNeedsJson(cleanedInput: any): string | undefined {
  if (cleanedInput.supportNeeds === undefined) return undefined;
  assertArrayOfOneOf(cleanedInput.supportNeeds, SUPPORT_NEEDS, LABEL.SUPPORT_NEEDS);
  return JSON.stringify(cleanedInput.supportNeeds);
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
    assertMaxLen(cleanedInput.postcode, LIMIT.SHORT, LABEL.POSTCODE);
    assertUkPostcodeFormat(cleanedInput.postcode, LABEL.POSTCODE);
  }

  assertOptionalStringMaxLen(cleanedInput.otherEnquiryText, LIMIT.XLONG, "Describe your enquiry");
  assertOptionalStringMaxLen(cleanedInput.urgentOtherReason, LIMIT.LONG, LABEL.URGENT_OTHER_REASON);
  assertOptionalStringMaxLen(cleanedInput.additionalInfo, LIMIT.XLONG, "additionalInfo");
  assertOptionalStringMaxLen(cleanedInput.supportNotes, LIMIT.LONG, "supportNotes");
  assertOptionalStringMaxLen(cleanedInput.otherSupport, LIMIT.LONG, "otherSupport");

  if (cleanedInput.childrenCount !== undefined) {
    assertOneOf(cleanedInput.childrenCount, CHILDREN_COUNT, "childrenCount");
  }
  if (cleanedInput.householdSize !== undefined) {
    assertOneOf(cleanedInput.householdSize, HOUSEHOLD_SIZE, "householdSize");
  }
  if (cleanedInput.ageRange !== undefined) {
    assertOneOf(cleanedInput.ageRange, AGE_RANGE, "ageRange");
  }

  if (cleanedInput.supportNeeds !== undefined) {
    assertArrayOfOneOf(cleanedInput.supportNeeds, SUPPORT_NEEDS, LABEL.SUPPORT_NEEDS);
    assert(cleanedInput.supportNeeds.length <= 6, "supportNeeds has too many items");
    assertUniqueStrings(cleanedInput.supportNeeds, LABEL.SUPPORT_NEEDS);
  }
}

function validateContact(cleanedInput: any) {
  if (cleanedInput.contactMethod === undefined) {
    if (cleanedInput.email !== undefined) assertEmail(cleanedInput.email, LABEL.EMAIL);
    if (cleanedInput.phone !== undefined) assertPhone(cleanedInput.phone, LABEL.PHONE);
    if (cleanedInput.phoneCountry !== undefined) {
      assertMaxLen(cleanedInput.phoneCountry, HYGIENE.PHONE_COUNTRY_MAX, LABEL.PHONE_COUNTRY);
    }
    return;
  }

  assertOneOf(cleanedInput.contactMethod, CONTACT_METHOD, LABEL.CONTACT_METHOD);

  if (cleanedInput.contactMethod === "Email") {
    assertEmail(cleanedInput.email, LABEL.EMAIL);
    if (cleanedInput.phone !== undefined) assertPhone(cleanedInput.phone, LABEL.PHONE);
    if (cleanedInput.phoneCountry !== undefined) {
      assertMaxLen(cleanedInput.phoneCountry, HYGIENE.PHONE_COUNTRY_MAX, LABEL.PHONE_COUNTRY);
    }
    return;
  }

  assertNonEmptyString(cleanedInput.phoneCountry, LABEL.PHONE_COUNTRY);
  assertMaxLen(cleanedInput.phoneCountry, HYGIENE.PHONE_COUNTRY_MAX, LABEL.PHONE_COUNTRY);
  assertPhone(cleanedInput.phone, LABEL.PHONE);

  if (cleanedInput.email !== undefined) assertEmail(cleanedInput.email, LABEL.EMAIL);
}

function validateRequired(cleanedInput: any) {
  assertOneOf(cleanedInput.department, DEPARTMENTS, LABEL.DEPARTMENT);
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
  const cleanedRaw = removeIrrelevantFields(input) as any;

  assert(cleanedRaw, "Input cannot be empty or only contain irrelevant fields");
  assertNoUnknownKeys(cleanedRaw);

  const cleanedInput = normaliseInput(cleanedRaw);
  const supportNeedsJson = getSupportNeedsJson(cleanedInput);

  validateRequired(cleanedInput);
  validateDisability(cleanedInput);
  validateProceed(cleanedInput);
  validatePronouns(cleanedInput);
  validateDomesticAbuse(cleanedInput);
  validateUrgent(cleanedInput);
  validateOptionals(cleanedInput);
  validateContact(cleanedInput);

  await ensureAmplifyConfigured();
  const client = generateClient<Schema>({ authMode: "iam" });

  const identity = event.identity;
  const sub =
    identity && typeof identity === "object" && "sub" in identity ? (identity.sub as string) : null;

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
      middleNames: cleanedInput.middleName,
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

    const { data: guestUserData, errors: guestUserErrors } = await client.models.User.create(userCreateInput);

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

      supportNeedsJson,
      supportNotes: cleanedInput.supportNotes,
      otherSupport: cleanedInput.otherSupport,

      additionalInfo: cleanedInput.additionalInfo,
    }) as any;

    const { data: caseData, errors: caseErrors } = await client.models.Case.create(caseCreateInput);

    if (caseErrors?.length || !caseData?.id) {
      logModelErrors("submitEnquiry: Case.create failed", caseErrors);
      throw new Error("Failed to submit enquiry");
    }

    createdCaseId = caseData.id;

    if (cleanedInput.proceed === "Book appointment") {
      const { data: apptData, errors: appointmentErrors } = await client.models.Appointment.create({
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