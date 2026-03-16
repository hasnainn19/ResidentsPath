/**
 * This file defines the schema for the enquiry submission form, including field constraints, option lists,
 * and validation logic.
 * The schema is used both in the frontend form and in the backend API handler to ensure consistent validation and data handling.
 */

import {
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { z } from "zod";
import { CASE_REFERENCE_RE } from "./referenceNumbers";

export const DEPARTMENTS = [
  { id: "COUNCIL_TAX_OR_HOUSING_BENEFIT_HELP", label: "Council Tax or Housing Benefit Help" },
  { id: "HOMELESSNESS", label: "Homelessness" },
  { id: "ADULTS_DUTY", label: "Adults duty" },
  { id: "CHILDRENS_DUTY", label: "Childrens duty" },
  { id: "COMMUNITY_HUB_ADVISOR", label: "Community Hub Advisor" },
  { id: "GENERAL_CUSTOMER_SERVICES", label: "General customer services" },
] as const;

export type DepartmentId = (typeof DEPARTMENTS)[number]["id"];
export type DepartmentLabel = (typeof DEPARTMENTS)[number]["label"];

export const DepartmentLabelById: Record<DepartmentId, string> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.id, d.label]),
) as Record<DepartmentId, string>;

export const DepartmentIdByLabel: Record<DepartmentLabel, DepartmentId> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.label, d.id]),
) as Record<DepartmentLabel, DepartmentId>;

// UI options and validation logic for the form fields are defined here to be shared between the frontend and backend.
export const UI_OPTIONS = {
  departments: DEPARTMENTS.map((d) => ({ value: d.id, label: d.label })),

  proceed: [
    { value: "BOOK_APPOINTMENT", label: "Book appointment" },
    { value: "JOIN_DIGITAL_QUEUE", label: "Join digital queue" },
  ],

  contactMethod: [
    { value: "TEXT_MESSAGE", label: "Text message" },
    { value: "EMAIL", label: "Email" },
  ],

  pronouns: [
    { value: "HE_HIM", label: "He/him" },
    { value: "SHE_HER", label: "She/her" },
    { value: "THEY_THEM", label: "They/them" },
    { value: "USE_MY_NAME_ONLY", label: "Use my name only" },
    { value: "OTHER", label: "Other" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  ],

  urgent: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "unsure", label: "Not sure" },
  ],

  urgentReason: [
    { value: "SAFETY_CONCERN", label: "Safety concern" },
    { value: "NO_SAFE_PLACE_TO_STAY_TONIGHT", label: "No safe place to stay tonight" },
    { value: "HEALTH_OR_MOBILITY", label: "Health or mobility" },
    { value: "TIME_LIMITED_TODAY", label: "Time-limited today" },
    { value: "OTHER", label: "Other" },
  ],

  childrenCount: [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6+", label: "6+" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  ],

  disabilityType: [
    { value: "MOBILITY_IMPAIRMENT", label: "Mobility impairment" },
    { value: "VISUAL_IMPAIRMENT", label: "Visual impairment" },
    { value: "HEARING_IMPAIRMENT", label: "Hearing impairment" },
    { value: "COGNITIVE_LEARNING", label: "Cognitive / learning" },
    { value: "MENTAL_HEALTH", label: "Mental health" },
    { value: "OTHER", label: "Other" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  ],

  householdSize: [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6+", label: "6+" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  ],

  safeToContact: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  ],

  ageRange: [
    { value: "UNDER_18", label: "Under 18" },
    { value: "AGE_18_24", label: "18-24" },
    { value: "AGE_25_34", label: "25-34" },
    { value: "AGE_35_44", label: "35-44" },
    { value: "AGE_45_54", label: "45-54" },
    { value: "AGE_55_64", label: "55-64" },
    { value: "AGE_65_PLUS", label: "65+" },
    { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
  ],

  supportNeeds: [
    { value: "ACCESSIBILITY", label: "Accessibility" },
    { value: "LANGUAGE", label: "Language" },
    { value: "SEATING", label: "Seating" },
    { value: "WRITTEN_UPDATES", label: "Written updates" },
    { value: "LARGE_TEXT", label: "Large text" },
    { value: "QUIET_SPACE", label: "Quiet space" },
    { value: "BSL", label: "BSL" },
    { value: "HELP_WITH_FORMS", label: "Help with forms" },
  ],
} as const;

export const DisabilityTypeValueByLabel = Object.fromEntries(
  UI_OPTIONS.disabilityType.map((o) => [o.label, o.value]),
);
export const AgeRangeValueByLabel = Object.fromEntries(
  UI_OPTIONS.ageRange.map((o) => [o.label, o.value]),
);
export const HouseholdSizeValueByLabel = Object.fromEntries(
  UI_OPTIONS.householdSize.map((o) => [o.label, o.value]),
);

// Create an enum from the option lists for use in the Zod schema
function enumFromOptions<const T extends ReadonlyArray<{ value: string }>>(opts: T) {
  const values = opts.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];
  return z.enum(values);
}

export const DepartmentEnum = enumFromOptions(UI_OPTIONS.departments);
export const ProceedEnum = enumFromOptions(UI_OPTIONS.proceed);
export const ContactMethodEnum = enumFromOptions(UI_OPTIONS.contactMethod);
export const PronounsEnum = enumFromOptions(UI_OPTIONS.pronouns);
export const UrgentEnum = enumFromOptions(UI_OPTIONS.urgent);
export const UrgentReasonEnum = enumFromOptions(UI_OPTIONS.urgentReason);
export const SafeToContactEnum = enumFromOptions(UI_OPTIONS.safeToContact);
export const ChildrenCountEnum = enumFromOptions(UI_OPTIONS.childrenCount);
export const DisabilityTypeEnum = enumFromOptions(UI_OPTIONS.disabilityType);
export const HouseholdSizeEnum = enumFromOptions(UI_OPTIONS.householdSize);
export const AgeRangeEnum = enumFromOptions(UI_OPTIONS.ageRange);
export const SupportNeedsEnum = enumFromOptions(UI_OPTIONS.supportNeeds);

export const LIMIT = {
  SHORT: 70,
  MEDIUM: 100,
  LONG: 500,
  XLONG: 1000,
} as const;

type TextFieldConstraint = {
  maxLen: number;
  allowNewlines?: boolean;
};

// Constraints for text fields, used for frontend limits and backend validation
export const FIELD_TEXT_CONSTRAINTS = {
  firstName: { maxLen: LIMIT.SHORT },
  middleName: { maxLen: LIMIT.SHORT },
  lastName: { maxLen: LIMIT.SHORT },
  preferredName: { maxLen: LIMIT.SHORT },

  email: { maxLen: LIMIT.MEDIUM },

  addressLine1: { maxLen: LIMIT.MEDIUM },
  addressLine2: { maxLen: LIMIT.MEDIUM },
  addressLine3: { maxLen: LIMIT.MEDIUM },
  townOrCity: { maxLen: LIMIT.SHORT },
  postcode: { maxLen: LIMIT.SHORT },

  pronounsOtherText: { maxLen: LIMIT.SHORT },

  safeContactNotes: { maxLen: LIMIT.XLONG, allowNewlines: true },

  urgentReasonOtherText: { maxLen: LIMIT.XLONG, allowNewlines: true },

  supportNotes: { maxLen: LIMIT.LONG, allowNewlines: true },
  otherSupport: { maxLen: LIMIT.LONG },

  otherEnquiryText: { maxLen: LIMIT.XLONG, allowNewlines: true },
  additionalInfo: { maxLen: LIMIT.XLONG, allowNewlines: true },
  caseUpdate: { maxLen: LIMIT.XLONG, allowNewlines: true },
} as const satisfies Record<string, TextFieldConstraint>;

const HYGIENE = {
  ENQUIRY_ID_MAX: 100,
  PHONE_MAX_CHARS: 30,
  PHONE_COUNTRY_MAX: 50,
  CASE_REFERENCE_MAX: 20,
} as const;

// Change empty strings to undefined, and trim whitespace.
function trimToUndef(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;
  const t = value.trim();
  return t.length ? t : undefined;
}

export function normaliseCaseReferenceNumber(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return value;

  const trimmed = value.trim().toUpperCase();
  return trimmed.length ? trimmed : undefined;
}

export function isValidCaseReferenceNumber(value: string) {
  return CASE_REFERENCE_RE.test(value);
}

export function getSupportedPhoneCountry(value: string | undefined): CountryCode | undefined {
  if (!value) return undefined;

  const country = value.trim().toUpperCase();
  if (!country.length) return undefined;

  if (!isSupportedCountry(country as CountryCode)) return undefined;
  return country as CountryCode;
}

export function normalisePhoneToE164(value: string, phoneCountry?: string) {
  const trimmed = value.trim();
  if (!trimmed.length) {
    return undefined;
  }

  const candidate = trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed;
  const supportedCountry = getSupportedPhoneCountry(phoneCountry);

  const parsed = candidate.startsWith("+")
    ? parsePhoneNumberFromString(candidate)
    : supportedCountry
      ? parsePhoneNumberFromString(candidate, supportedCountry)
      : undefined;

  if (!parsed || !parsed.isValid()) {
    return undefined;
  }

  return parsed.number;
}

export function normaliseUkPostcode(value: string) {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function normaliseAppointmentDateIso(value: unknown) {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "object" && value) {
    const maybeDayjs = value as { format?: (fmt: string) => unknown };
    if (typeof maybeDayjs.format === "function") {
      const s = String(maybeDayjs.format("YYYY-MM-DD"));
      return s.trim().length ? s : undefined;
    }
  }

  if (typeof value !== "string") return value;

  const t = value.trim();
  if (!t.length) return undefined;

  if (/^\d{4}-\d{2}-\d{2}T/.test(t)) return t.slice(0, 10);

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
    const [dd, mm, yyyy] = t.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  return t;
}

function isValidTimeHHmm(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export const APPOINTMENT_SLOT_START = "09:30";
export const APPOINTMENT_SLOT_END = "16:30";
export const APPOINTMENT_SLOT_INTERVAL_MINUTES = 30;
export const APPOINTMENT_SLOT_VALIDATION_MESSAGE =
  `appointmentTime must be a ${APPOINTMENT_SLOT_INTERVAL_MINUTES}-minute slot between ` +
  `${APPOINTMENT_SLOT_START} and ${APPOINTMENT_SLOT_END}`;
export const APPOINTMENT_MUST_BE_FUTURE_MESSAGE = "Appointments must be in the future";

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// Get all bookable appointment times for a given date (all time slots in intervals of APPOINTMENT_SLOT_INTERVAL_MINUTES) within the defined start and end times
export function isBookableAppointmentTime(value: string) {
  if (!isValidTimeHHmm(value)) return false;

  const totalMinutes = timeToMinutes(value);
  return (
    totalMinutes >= timeToMinutes(APPOINTMENT_SLOT_START) &&
    totalMinutes <= timeToMinutes(APPOINTMENT_SLOT_END) &&
    totalMinutes % APPOINTMENT_SLOT_INTERVAL_MINUTES === 0
  );
}

export function getBookableAppointmentTimes() {
  const times: string[] = [];

  for (
    let totalMinutes = timeToMinutes(APPOINTMENT_SLOT_START);
    totalMinutes <= timeToMinutes(APPOINTMENT_SLOT_END);
    totalMinutes += APPOINTMENT_SLOT_INTERVAL_MINUTES
  ) {
    times.push(minutesToTime(totalMinutes));
  }

  return times;
}

type AppointmentCurrentDateTime = {
  dateIso: string;
  time: string;
};

export function getCurrentAppointmentDateTime(now = new Date()): AppointmentCurrentDateTime {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!year || !month || !day || !hour || !minute) {
    throw new Error("Failed to compute current appointment date and time");
  }

  return {
    dateIso: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

// Check if the given appointment date and time is in the future
export function isFutureAppointmentDateTime(dateIso: string, time: string, now = new Date()) {
  if (!isValidIsoDate(dateIso) || !isBookableAppointmentTime(time)) return false;

  const current = getCurrentAppointmentDateTime(now);

  if (dateIso !== current.dateIso) {
    return dateIso > current.dateIso;
  }

  return time > current.time;
}

// Get all bookable appointment times for a given date that are in the future
export function getFutureBookableAppointmentTimes(dateIso: string, now = new Date()) {
  if (!isValidIsoDate(dateIso)) return [];

  return getBookableAppointmentTimes().filter((time) =>
    isFutureAppointmentDateTime(dateIso, time, now),
  );
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhoneChars(value: string) {
  return /^[0-9+().\-\s]+$/.test(value);
}

export function countDigits(value: string) {
  return value.replace(/\D/g, "").length;
}

export function isValidUkPostcode(value: string) {
  const compact = value.replace(/\s+/g, "").toUpperCase();
  const re = /^(GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/;
  return re.test(compact);
}

type AppointmentValidationFields = {
  proceed: z.infer<typeof ProceedEnum>;
  appointmentDateIso?: string;
  appointmentTime?: string;
};

function validateAppointment(
  value: AppointmentValidationFields,
  ctx: z.RefinementCtx,
) {
  if (value.proceed === "BOOK_APPOINTMENT") {
    if (!value.appointmentDateIso) {
      ctx.addIssue({
        code: "custom",
        path: ["appointmentDateIso"],
        message: "appointmentDateIso is required for appointment",
      });
    }
    if (!value.appointmentTime) {
      ctx.addIssue({
        code: "custom",
        path: ["appointmentTime"],
        message: "appointmentTime is required for appointment",
      });
    }
    if (
      value.appointmentDateIso &&
      value.appointmentTime &&
      isValidIsoDate(value.appointmentDateIso) &&
      isBookableAppointmentTime(value.appointmentTime) &&
      !isFutureAppointmentDateTime(value.appointmentDateIso, value.appointmentTime)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["appointmentTime"],
        message: APPOINTMENT_MUST_BE_FUTURE_MESSAGE,
      });
    }
  } else {
    if (value.appointmentDateIso) {
      ctx.addIssue({
        code: "custom",
        path: ["appointmentDateIso"],
        message: "appointmentDateIso must not be provided for queue",
      });
    }
    if (value.appointmentTime) {
      ctx.addIssue({
        code: "custom",
        path: ["appointmentTime"],
        message: "appointmentTime must not be provided for queue",
      });
    }
  }
}

function hasInvalidControlCharacters(value: string, allowNewlines = false) {
  for (const char of value) {
    const code = char.charCodeAt(0);

    if (code === 0x7f) {
      return true;
    }

    if (code < 0x20) {
      if (allowNewlines && (code === 0x0a || code === 0x0d)) {
        continue;
      }

      return true;
    }
  }

  return false;
}

// Validation for "other" free text fields: required when "Other" option is selected
const otherFreeText = (maxLen: number) =>
  z
    .string()
    .max(maxLen)
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "Details are required when Other is selected")
    .refine((s) => !hasInvalidControlCharacters(s, true), "Contains invalid control characters");

// The main Zod schema for the enquiry submission payload, used for validation in both frontend and backend
export const formSchema = z
  .object({
    departmentId: DepartmentEnum,
    enquiry: z
      .string()
      .transform((s) => s.trim())
      .refine((s) => s.length > 0, "Enquiry is required")
      .refine((s) => s.length <= HYGIENE.ENQUIRY_ID_MAX, "Enquiry is too long")
      .refine(
        (s) => !hasInvalidControlCharacters(s),
        "Enquiry contains invalid control characters",
      ),

    proceed: ProceedEnum,

    appointmentDateIso: z.preprocess(
      normaliseAppointmentDateIso,
      z.string().refine(isValidIsoDate, "appointmentDateIso must be YYYY-MM-DD").optional(),
    ),
    appointmentTime: z.preprocess(
      trimToUndef,
      z
        .string()
        .refine(isValidTimeHHmm, "appointmentTime must be HH:mm")
        .refine(isBookableAppointmentTime, APPOINTMENT_SLOT_VALIDATION_MESSAGE)
        .optional(),
    ),

    firstName: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.firstName.maxLen).optional(),
    ),
    middleName: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.middleName.maxLen).optional(),
    ),
    lastName: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.lastName.maxLen).optional(),
    ),
    preferredName: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.preferredName.maxLen).optional(),
    ),

    pronouns: z.preprocess(trimToUndef, PronounsEnum.optional()),
    pronounsOtherText: z.preprocess(
      trimToUndef,
      otherFreeText(FIELD_TEXT_CONSTRAINTS.pronounsOtherText.maxLen).optional(),
    ),

    dob: z.preprocess(
      trimToUndef,
      z.string().refine(isValidIsoDate, "dob must be YYYY-MM-DD").optional(),
    ),

    addressLine1: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.addressLine1.maxLen).optional(),
    ),
    addressLine2: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.addressLine2.maxLen).optional(),
    ),
    addressLine3: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.addressLine3.maxLen).optional(),
    ),
    townOrCity: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.townOrCity.maxLen).optional(),
    ),
    postcode: z
      .preprocess(trimToUndef, z.string().max(FIELD_TEXT_CONSTRAINTS.postcode.maxLen).optional())
      .transform((v) => (v ? normaliseUkPostcode(v) : v))
      .refine((v) => (v ? isValidUkPostcode(v) : true), "Postcode format is invalid"),

    contactMethod: z.preprocess(trimToUndef, ContactMethodEnum.optional()),
    email: z.preprocess(
      (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
      z.string().email().max(FIELD_TEXT_CONSTRAINTS.email.maxLen).optional(),
    ),
    phoneCountry: z.preprocess(
      (v) => {
        if (typeof v !== "string") return v;

        const trimmed = v.trim();
        return trimmed ? trimmed.toUpperCase() : undefined;
      },
      z
        .string()
        .max(HYGIENE.PHONE_COUNTRY_MAX)
        .refine(
          (v) => getSupportedPhoneCountry(v) !== undefined,
          "Phone country must be a supported country code",
        )
        .optional(),
    ),
    phone: z
      .preprocess(trimToUndef, z.string().max(HYGIENE.PHONE_MAX_CHARS).optional())
      .refine((v) => (v ? isValidPhoneChars(v) : true), "Phone contains invalid characters")
      .refine(
        (v) => (v ? countDigits(v) >= 7 && countDigits(v) <= 15 : true),
        "Phone must have 7 to 15 digits",
      ),

    childrenCount: z.preprocess(trimToUndef, ChildrenCountEnum.optional()),
    householdSize: z.preprocess(trimToUndef, HouseholdSizeEnum.optional()),
    ageRange: z.preprocess(trimToUndef, AgeRangeEnum.optional()),

    hasDisabilityOrSensory: z.boolean().optional(),
    disabilityType: z.preprocess(trimToUndef, DisabilityTypeEnum.optional()),

    domesticAbuse: z.boolean().optional(),
    safeToContact: z.preprocess(trimToUndef, SafeToContactEnum.optional()),
    safeContactNotes: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.safeContactNotes.maxLen).optional(),
    ),

    urgent: z.preprocess(trimToUndef, UrgentEnum.optional()),
    urgentReason: z.preprocess(trimToUndef, UrgentReasonEnum.optional()),
    urgentReasonOtherText: z.preprocess(
      trimToUndef,
      otherFreeText(FIELD_TEXT_CONSTRAINTS.urgentReasonOtherText.maxLen).optional(),
    ),

    supportNeeds: z
      .array(SupportNeedsEnum)
      .max(UI_OPTIONS.supportNeeds.length, "Too many support needs")
      .optional()
      .refine(
        (arr) => (arr ? new Set(arr).size === arr.length : true),
        "supportNeeds must not contain duplicates",
      ),

    supportNotes: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.supportNotes.maxLen).optional(),
    ),
    otherSupport: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.otherSupport.maxLen).optional(),
    ),

    otherEnquiryText: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.otherEnquiryText.maxLen).optional(),
    ),
    additionalInfo: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.additionalInfo.maxLen).optional(),
    ),
  })
  .strict()
  .superRefine((v, ctx) => {
    validateAppointment(v, ctx);

    if (v.domesticAbuse === true) {
      if (!v.safeToContact) {
        ctx.addIssue({
          code: "custom",
          path: ["safeToContact"],
          message: "safeToContact is required when domesticAbuse is true",
        });
      }
      if (v.safeToContact === "no") {
        if (!v.safeContactNotes) {
          ctx.addIssue({
            code: "custom",
            path: ["safeContactNotes"],
            message: "safeContactNotes is required when safeToContact is no",
          });
        }
      } else {
        if (v.safeContactNotes) {
          ctx.addIssue({
            code: "custom",
            path: ["safeContactNotes"],
            message: "safeContactNotes must only be provided when safeToContact is no",
          });
        }
      }
    } else {
      if (v.safeToContact) {
        ctx.addIssue({
          code: "custom",
          path: ["safeToContact"],
          message: "safeToContact must not be provided unless domesticAbuse is true",
        });
      }
      if (v.safeContactNotes) {
        ctx.addIssue({
          code: "custom",
          path: ["safeContactNotes"],
          message: "safeContactNotes must not be provided unless domesticAbuse is true",
        });
      }
    }

    if (v.urgent !== undefined) {
      if (v.urgent !== "yes") {
        if (v.urgentReason) {
          ctx.addIssue({
            code: "custom",
            path: ["urgentReason"],
            message: "urgentReason must not be provided unless urgent is yes",
          });
        }
        if (v.urgentReasonOtherText) {
          ctx.addIssue({
            code: "custom",
            path: ["urgentReasonOtherText"],
            message: "urgentReasonOtherText must not be provided unless urgent is yes",
          });
        }
      } else {
        if (!v.urgentReason) {
          ctx.addIssue({
            code: "custom",
            path: ["urgentReason"],
            message: "urgentReason is required when urgent is yes",
          });
        }

        if (v.urgentReason === "OTHER") {
          if (!v.urgentReasonOtherText) {
            ctx.addIssue({
              code: "custom",
              path: ["urgentReasonOtherText"],
              message: "Details are required when Other is selected",
            });
          }
        } else {
          if (v.urgentReasonOtherText) {
            ctx.addIssue({
              code: "custom",
              path: ["urgentReasonOtherText"],
              message: "urgentReasonOtherText must only be provided when urgentReason is OTHER",
            });
          }
        }
      }
    }

    if (v.pronouns === "OTHER") {
      if (!v.pronounsOtherText) {
        ctx.addIssue({
          code: "custom",
          path: ["pronounsOtherText"],
          message: "Details are required when Other is selected",
        });
      }
    } else {
      if (v.pronounsOtherText) {
        ctx.addIssue({
          code: "custom",
          path: ["pronounsOtherText"],
          message: "pronounsOtherText must only be provided when pronouns is OTHER",
        });
      }
    }

    if (v.hasDisabilityOrSensory === undefined) {
      if (v.disabilityType) {
        ctx.addIssue({
          code: "custom",
          path: ["disabilityType"],
          message: "disabilityType must not be provided when hasDisabilityOrSensory is undefined",
        });
      }
    } else if (v.hasDisabilityOrSensory === false) {
      if (v.disabilityType) {
        ctx.addIssue({
          code: "custom",
          path: ["disabilityType"],
          message: "disabilityType must not be provided when hasDisabilityOrSensory is false",
        });
      }
    }

    if (v.contactMethod === "EMAIL") {
      if (!v.email) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "Email is required when contactMethod is EMAIL",
        });
      }
    }

    if (v.contactMethod === "TEXT_MESSAGE") {
      if (!v.phoneCountry) {
        ctx.addIssue({
          code: "custom",
          path: ["phoneCountry"],
          message: "Phone country is required when contactMethod is TEXT_MESSAGE",
        });
      }
      if (!v.phone) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Phone is required when contactMethod is TEXT_MESSAGE",
        });
      }
    }

    if (
      v.phone &&
      isValidPhoneChars(v.phone) &&
      countDigits(v.phone) >= 7 &&
      countDigits(v.phone) <= 15 &&
      !normalisePhoneToE164(v.phone, v.phoneCountry)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Phone must be a valid phone number",
      });
    }

    if (v.enquiry === "OTHER") {
      if (!v.otherEnquiryText) {
        ctx.addIssue({
          code: "custom",
          path: ["otherEnquiryText"],
          message: "Details are required when Other is selected",
        });
      }
    } else {
      if (v.otherEnquiryText) {
        ctx.addIssue({
          code: "custom",
          path: ["otherEnquiryText"],
          message: "otherEnquiryText must only be provided when enquiry is OTHER",
        });
      }
    }
  })
  .transform((v) => {
    const normalisedPhone = v.phone ? normalisePhoneToE164(v.phone, v.phoneCountry) : undefined;

    return {
      ...v,
      phone: normalisedPhone ?? v.phone,
    };
  });

export type formInput = z.infer<typeof formSchema>;

export const caseFollowUpSchema = z
  .object({
    referenceNumber: z.preprocess(
      normaliseCaseReferenceNumber,
      z
        .string()
        .max(HYGIENE.CASE_REFERENCE_MAX)
        .refine(isValidCaseReferenceNumber, "Case reference number format is invalid"),
    ),
    caseUpdate: z.preprocess(
      trimToUndef,
      z.string().max(FIELD_TEXT_CONSTRAINTS.caseUpdate.maxLen).optional(),
    ),
    proceed: ProceedEnum,
    appointmentDateIso: z.preprocess(
      normaliseAppointmentDateIso,
      z.string().refine(isValidIsoDate, "appointmentDateIso must be YYYY-MM-DD").optional(),
    ),
    appointmentTime: z.preprocess(
      trimToUndef,
      z
        .string()
        .refine(isValidTimeHHmm, "appointmentTime must be HH:mm")
        .refine(isBookableAppointmentTime, APPOINTMENT_SLOT_VALIDATION_MESSAGE)
        .optional(),
    ),
  })
  .strict()
  .superRefine(validateAppointment);

export type caseFollowUpInput = z.infer<typeof caseFollowUpSchema>;
