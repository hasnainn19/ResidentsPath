import { describe, expect, it, vi } from "vitest";

import {
  caseFollowUpSchema,
  formSchema,
  getBookableAppointmentTimes,
  getCurrentAppointmentDateTime,
  getFutureBookableAppointmentTimes,
  getSupportedPhoneCountry,
  isBookableAppointmentTime,
  isFutureAppointmentDateTime,
  isValidEmail,
  isValidIsoDate,
  normalisePhoneToE164,
  normaliseUkPostcode,
} from "../../shared/formSchema";

function expectZodIssues(
  result: { success: boolean; error?: { issues: unknown[] } },
  ...issues: Array<{ path: string[]; message: string }>
) {
  if (result.success) throw new Error("Expected parse to fail");
  expect(result.error!.issues).toEqual(
    expect.arrayContaining(
      issues.map(({ path, message }) => expect.objectContaining({ path, message }))
    )
  );
}

const baseFormInput = {
  departmentName: "Homelessness" as const,
  enquiry: "Help with housing",
  proceed: "JOIN_DIGITAL_QUEUE" as const,
  firstName: "Test",
  lastName: "Tester",
};

describe("formSchema shared helpers", () => {
  it("normalises supported phone countries", () => {
    expect(getSupportedPhoneCountry("gb")).toBe("GB");
    expect(getSupportedPhoneCountry("zz")).toBeUndefined();
  });

  it("returns undefined for missing or blank phone countries", () => {
    expect(getSupportedPhoneCountry(undefined)).toBeUndefined();
    expect(getSupportedPhoneCountry("   ")).toBeUndefined();
  });

  it("normalises local and international phone numbers to E.164", () => {
    expect(normalisePhoneToE164("020 7946 0018", "GB")).toBe("+442079460018");
    expect(normalisePhoneToE164("00442079460018")).toBe("+442079460018");
  });

  it("returns undefined for blank phone input", () => {
    expect(normalisePhoneToE164("   ", "GB")).toBeUndefined();
  });

  it("returns undefined for invalid phone numbers", () => {
    expect(normalisePhoneToE164("12345", "GB")).toBeUndefined();
    expect(normalisePhoneToE164("02079460018")).toBeUndefined();
  });

  it("normalises UK postcodes into the shared display format", () => {
    expect(normaliseUkPostcode("tw34ab")).toBe("TW3 4AB");
  });

  it("leaves very short postcode strings unspaced", () => {
    expect(normaliseUkPostcode("w1")).toBe("W1");
  });

  it("accepts real ISO dates and rejects invalid ones", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
  });

  it("accepts valid email addresses and rejects invalid ones", () => {
    expect(isValidEmail("test.tester@example.com")).toBe(true);
    expect(isValidEmail("test.tester")).toBe(false);
  });

  it("accepts only bookable appointment times", () => {
    expect(isBookableAppointmentTime("09:30")).toBe(true);
    expect(isBookableAppointmentTime("16:30")).toBe(true);
    expect(isBookableAppointmentTime("09:45")).toBe(false);
    expect(isBookableAppointmentTime("17:00")).toBe(false);
    expect(isBookableAppointmentTime("not-a-time")).toBe(false);
  });

  it("returns the full set of bookable appointment times", () => {
    expect(getBookableAppointmentTimes()).toEqual([
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
    ]);
  });

  it("computes the current appointment time in the London timezone", () => {
    expect(getCurrentAppointmentDateTime(new Date("2026-06-01T11:15:00Z"))).toEqual({
      dateIso: "2026-06-01",
      time: "12:15",
    });
  });

  it("throws when the current appointment time cannot be computed", () => {
    const dateTimeSpy = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
      function() {
        return { formatToParts: () => [{ type: "year", value: "2026" }] } as unknown as Intl.DateTimeFormat;
      }
    );

    try {
      expect(() => getCurrentAppointmentDateTime(new Date("2026-06-01T11:15:00Z"))).toThrow(
        "Failed to compute current appointment date and time",
      );
    } finally {
      dateTimeSpy.mockRestore();
    }
  });

  it("checks whether an appointment slot is in the future", () => {
    const now = new Date("2026-06-01T11:15:00Z");

    expect(isFutureAppointmentDateTime("2026-06-01", "12:30", now)).toBe(true);
    expect(isFutureAppointmentDateTime("2026-06-01", "12:00", now)).toBe(false);
    expect(isFutureAppointmentDateTime("2026-06-02", "09:30", now)).toBe(true);
  });

  it("returns false for invalid appointment dates or times", () => {
    const now = new Date("2026-06-01T11:15:00Z");

    expect(isFutureAppointmentDateTime("invalid-date", "09:30", now)).toBe(false);
    expect(isFutureAppointmentDateTime("2026-06-01", "09:45", now)).toBe(false);
  });

  it("filters bookable times down to the remaining future slots for a day", () => {
    expect(
      getFutureBookableAppointmentTimes("2026-06-01", new Date("2026-06-01T11:15:00Z")),
    ).toEqual([
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
    ]);
  });

  it("returns no future bookable times for an invalid date", () => {
    expect(getFutureBookableAppointmentTimes("invalid-date")).toEqual([]);
  });
});

describe("formSchema", () => {
  it("normalises shared form values during a successful parse", () => {
    const result = formSchema.parse({
      ...baseFormInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "01/06/2099",
      appointmentTime: "10:00",
      postcode: "tw34ab",
      email: "  TEST.TESTER@EXAMPLE.COM ",
      contactMethod: "TEXT_MESSAGE",
      phoneCountry: "gb",
      phone: "020 7946 0018",
    });

    expect(result.appointmentDateIso).toBe("2099-06-01");
    expect(result.postcode).toBe("TW3 4AB");
    expect(result.email).toBe("test.tester@example.com");
    expect(result.phoneCountry).toBe("GB");
    expect(result.phone).toBe("+442079460018");
  });

  it("treats blank optional trim-to-undefined fields as missing values during parsing", () => {
    const result = formSchema.parse({
      ...baseFormInput,
      middleName: "   ",
    });

    expect(result.middleName).toBeUndefined();
  });

  it("rejects a missing first name", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      firstName: "   ",
    });

    expectZodIssues(result, { path: ["firstName"], message: "firstName is required" });
  });

  it("rejects a missing last name", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      lastName: "   ",
    });

    expectZodIssues(result, { path: ["lastName"], message: "lastName is required" });
  });

  it("rejects non-string values passed through trim-to-undefined preprocessing", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      firstName: 123 as unknown as string,
    });

    expect(result.success).toBe(false);
  });

  it("normalises appointment dates from ISO date-time strings during parsing", () => {
    const result = formSchema.parse({
      ...baseFormInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2099-06-01T10:00:00.000Z",
      appointmentTime: "10:00",
    });

    expect(result.appointmentDateIso).toBe("2099-06-01");
  });

  it("normalises appointment dates from Dayjs-like objects during parsing", () => {
    const result = formSchema.parse({
      ...baseFormInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: {
        format: () => "2099-06-01",
      },
      appointmentTime: "10:00",
    });

    expect(result.appointmentDateIso).toBe("2099-06-01");
  });

  it("treats blank appointment date strings as missing values", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "   ",
      appointmentTime: "10:00",
    });

    expectZodIssues(result, { path: ["appointmentDateIso"], message: "appointmentDateIso is required for appointment" });
  });

  it("treats blank Dayjs-like appointment dates as missing values", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: {
        format: () => "   ",
      },
      appointmentTime: "10:00",
    });

    expectZodIssues(result, { path: ["appointmentDateIso"], message: "appointmentDateIso is required for appointment" });
  });

  it("rejects non-string appointment date objects that are not Dayjs-like", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: { year: 2099 },
      appointmentTime: "10:00",
    });

    expect(result.success).toBe(false);
  });

  it("treats null appointment dates as missing values", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: null as unknown as string,
      appointmentTime: "10:00",
    });

    expectZodIssues(result, { path: ["appointmentDateIso"], message: "appointmentDateIso is required for appointment" });
  });

  it("normalises blank phone country input to undefined during parsing", () => {
    const result = formSchema.parse({
      ...baseFormInput,
      phoneCountry: "   ",
    });

    expect(result.phoneCountry).toBeUndefined();
  });

  it("rejects appointment slots that are not in the future", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2000-01-01",
      appointmentTime: "09:30",
    });

    expectZodIssues(result, { path: ["appointmentTime"], message: "Appointments must be in the future" });
  });

  it("rejects appointment details on the queue path", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      appointmentDateIso: "2099-06-01",
      appointmentTime: "10:00",
    });

    expectZodIssues(result,
      { path: ["appointmentDateIso"], message: "appointmentDateIso must not be provided for queue" },
      { path: ["appointmentTime"], message: "appointmentTime must not be provided for queue" },
    );
  });

  it("requires an urgent reason when urgent is yes", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      urgent: "yes",
    });

    expectZodIssues(result, { path: ["urgentReason"], message: "urgentReason is required when urgent is yes" });
  });

  it("requires extra details when the urgent reason is Other", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      urgent: "yes",
      urgentReason: "OTHER",
    });

    expectZodIssues(result, { path: ["urgentReasonOtherText"], message: "Details are required when Other is selected" });
  });

  it("rejects urgent other text when urgent is not yes", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      urgent: "no",
      urgentReasonOtherText: "Need help today",
    });

    expectZodIssues(result, { path: ["urgentReasonOtherText"], message: "urgentReasonOtherText must not be provided unless urgent is yes" });
  });

  it("rejects an urgent reason when urgent is not yes", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      urgent: "no",
      urgentReason: "SAFETY_CONCERN",
    });

    expectZodIssues(result, { path: ["urgentReason"], message: "urgentReason must not be provided unless urgent is yes" });
  });

  it("rejects urgent other text when the urgent reason is not Other", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      urgent: "yes",
      urgentReason: "SAFETY_CONCERN",
      urgentReasonOtherText: "Need help today",
    });

    expectZodIssues(result, { path: ["urgentReasonOtherText"], message: "urgentReasonOtherText must only be provided when urgentReason is OTHER" });
  });

  it("requires safe contact notes when domestic abuse is true and contact is not safe", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      domesticAbuse: true,
      safeToContact: "no",
    });

    expectZodIssues(result, { path: ["safeContactNotes"], message: "safeContactNotes is required when safeToContact is no" });
  });

  it("requires a safe contact answer when domestic abuse is flagged", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      domesticAbuse: true,
    });

    expectZodIssues(result, { path: ["safeToContact"], message: "safeToContact is required when domesticAbuse is true" });
  });

  it("rejects safe contact notes when contact is marked safe", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      domesticAbuse: true,
      safeToContact: "yes",
      safeContactNotes: "Use email only",
    });

    expectZodIssues(result, { path: ["safeContactNotes"], message: "safeContactNotes must only be provided when safeToContact is no" });
  });

  it("rejects safe contact details when domestic abuse is false", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      domesticAbuse: false,
      safeToContact: "yes",
      safeContactNotes: "Use email only",
    });

    expectZodIssues(result,
      { path: ["safeToContact"], message: "safeToContact must not be provided unless domesticAbuse is true" },
      { path: ["safeContactNotes"], message: "safeContactNotes must not be provided unless domesticAbuse is true" },
    );
  });

  it("rejects pronounsOtherText when pronouns is not Other", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      pronouns: "HE_HIM",
      pronounsOtherText: "He/him",
    });

    expectZodIssues(result, { path: ["pronounsOtherText"], message: "pronounsOtherText must only be provided when pronouns is OTHER" });
  });

  it("requires pronounsOtherText when pronouns is Other", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      pronouns: "OTHER",
    });

    expectZodIssues(result, { path: ["pronounsOtherText"], message: "Details are required when Other is selected" });
  });

  it("rejects newlines in pronounsOtherText", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      pronouns: "OTHER",
      pronounsOtherText: "Line one\nLine two",
    });

    expectZodIssues(result, { path: ["pronounsOtherText"], message: "Contains invalid control characters" });
  });

  it("allows newlines in urgentReasonOtherText", () => {
    const result = formSchema.parse({
      ...baseFormInput,
      urgent: "yes",
      urgentReason: "OTHER",
      urgentReasonOtherText: "Line one\nLine two",
    });

    expect(result.urgentReasonOtherText).toBe("Line one\nLine two");
  });

  it("allows carriage returns in urgentReasonOtherText", () => {
    const result = formSchema.parse({
      ...baseFormInput,
      urgent: "yes",
      urgentReason: "OTHER",
      urgentReasonOtherText: "Line one\rLine two",
    });

    expect(result.urgentReasonOtherText).toBe("Line one\rLine two");
  });

  it("rejects other-text fields with disallowed control characters", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      pronouns: "OTHER",
      pronounsOtherText: "Line one\tLine two",
    });

    expectZodIssues(result, { path: ["pronounsOtherText"], message: "Contains invalid control characters" });
  });

  it("rejects other-text fields with the delete control character", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      pronouns: "OTHER",
      pronounsOtherText: "Line one\u007fLine two",
    });

    expectZodIssues(result, { path: ["pronounsOtherText"], message: "Contains invalid control characters" });
  });

  it("rejects disability details when disability status is not provided", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      disabilityType: "HEARING_IMPAIRMENT",
    });

    expectZodIssues(result, { path: ["disabilityType"], message: "disabilityType must not be provided when hasDisabilityOrSensory is undefined" });
  });

  it("rejects disability details when disability status is false", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      hasDisabilityOrSensory: false,
      disabilityType: "HEARING_IMPAIRMENT",
    });

    expectZodIssues(result, { path: ["disabilityType"], message: "disabilityType must not be provided when hasDisabilityOrSensory is false" });
  });

  it("requires an email address when contactMethod is email", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      contactMethod: "EMAIL",
    });

    expectZodIssues(result, { path: ["email"], message: "Email is required when contactMethod is EMAIL" });
  });

  it("requires phone fields when contactMethod is text message", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      contactMethod: "TEXT_MESSAGE",
    });

    expectZodIssues(result,
      { path: ["phoneCountry"], message: "Phone country is required when contactMethod is TEXT_MESSAGE" },
      { path: ["phone"], message: "Phone is required when contactMethod is TEXT_MESSAGE" },
    );
  });

  it("rejects phone numbers that have valid characters but are not real numbers", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      contactMethod: "TEXT_MESSAGE",
      phoneCountry: "GB",
      phone: "0000000",
    });

    expectZodIssues(result, { path: ["phone"], message: "Phone must be a valid phone number" });
  });

  it("rejects duplicate support needs", () => {
    const result = formSchema.safeParse({
      ...baseFormInput,
      supportNeeds: ["ACCESSIBILITY", "ACCESSIBILITY"],
    });

    expectZodIssues(result, { path: ["supportNeeds"], message: "supportNeeds must not contain duplicates" });
  });
});

describe("caseFollowUpSchema", () => {
  it("normalises the case reference number during parsing", () => {
    const result = caseFollowUpSchema.parse({
      referenceNumber: "  abc-def234  ",
      proceed: "JOIN_DIGITAL_QUEUE",
    });

    expect(result.referenceNumber).toBe("ABC-DEF234");
  });

  it("requires appointment details when booking a follow-up appointment", () => {
    const result = caseFollowUpSchema.safeParse({
      referenceNumber: "ABC-DEF234",
      proceed: "BOOK_APPOINTMENT",
    });

    expectZodIssues(result,
      { path: ["appointmentDateIso"], message: "appointmentDateIso is required for appointment" },
      { path: ["appointmentTime"], message: "appointmentTime is required for appointment" },
    );
  });

  it("rejects appointment details on the queue follow-up path", () => {
    const result = caseFollowUpSchema.safeParse({
      referenceNumber: "ABC-DEF234",
      proceed: "JOIN_DIGITAL_QUEUE",
      appointmentDateIso: "2099-06-01",
      appointmentTime: "10:00",
    });

    expectZodIssues(result,
      { path: ["appointmentDateIso"], message: "appointmentDateIso must not be provided for queue" },
      { path: ["appointmentTime"], message: "appointmentTime must not be provided for queue" },
    );
  });
});
