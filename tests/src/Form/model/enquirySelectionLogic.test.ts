import { describe, expect, it } from "vitest";

import {
  applyEnquiryChange,
  applyProceedChange,
  applyTopLevelChange,
  applyUrgencyChange,
  computeCanGoNext,
  getEnquiryOptions,
  resetFormInfo,
  shouldShowSupportNotes,
} from "../../../../src/pages/Form/model/enquirySelectionLogic";
import type { FormData } from "../../../../src/pages/Form/model/formFieldTypes";
import { initialFormData } from "../../../../src/pages/Form/model/initialState";

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...initialFormData,
    ...overrides,
  };
}

describe("enquirySelectionLogic", () => {
  it("returns enquiry options only for known top-level areas", () => {
    expect(getEnquiryOptions("")).toEqual([]);
    expect(getEnquiryOptions("Unknown")).toEqual([]);
    expect(getEnquiryOptions("Housing").map((item) => item.value)).toContain("homelessness");
  });

  it("blocks continuing when the enquiry selection is incomplete", () => {
    expect(computeCanGoNext(makeFormData(), false, false)).toBe(false);
  });

  it("blocks continuing when no proceed option has been chosen", () => {
    expect(computeCanGoNext(makeFormData({ proceed: "" }), true, false)).toBe(false);
  });

  it("blocks continuing when domestic abuse notes are required but blank", () => {
    expect(
      computeCanGoNext(
        makeFormData({
          proceed: "JOIN_DIGITAL_QUEUE",
          domesticAbuse: true,
          safeToContact: "no",
          safeContactNotes: "   ",
        }),
        true,
        false,
      ),
    ).toBe(false);
  });

  it("blocks continuing when domestic abuse notes are missing entirely", () => {
    expect(
      computeCanGoNext(
        {
          ...makeFormData({
            proceed: "JOIN_DIGITAL_QUEUE",
            domesticAbuse: true,
            safeToContact: "no",
          }),
          safeContactNotes: undefined as unknown as string,
        },
        true,
        false,
      ),
    ).toBe(false);
  });

  it("allows continuing when domestic abuse is selected but contact is safe", () => {
    expect(
      computeCanGoNext(
        makeFormData({
          proceed: "JOIN_DIGITAL_QUEUE",
          domesticAbuse: true,
          safeToContact: "yes",
        }),
        true,
        false,
      ),
    ).toBe(true);
  });

  it("blocks continuing when an urgent reason is required but missing", () => {
    expect(
      computeCanGoNext(
        makeFormData({
          proceed: "JOIN_DIGITAL_QUEUE",
          urgentReason: "",
        }),
        true,
        true,
      ),
    ).toBe(false);
  });

  it("blocks continuing when an Other urgent reason has no details", () => {
    expect(
      computeCanGoNext(
        makeFormData({
          proceed: "JOIN_DIGITAL_QUEUE",
          urgentReason: "OTHER",
          urgentReasonOtherText: "   ",
        }),
        true,
        true,
      ),
    ).toBe(false);
  });

  it("blocks continuing when an Other urgent reason is missing its details entirely", () => {
    expect(
      computeCanGoNext(
        {
          ...makeFormData({
            proceed: "JOIN_DIGITAL_QUEUE",
            urgentReason: "OTHER",
          }),
          urgentReasonOtherText: undefined as unknown as string,
        },
        true,
        true,
      ),
    ).toBe(false);
  });

  it("allows continuing when all required answers are present", () => {
    expect(
      computeCanGoNext(
        makeFormData({
          proceed: "JOIN_DIGITAL_QUEUE",
          domesticAbuse: true,
          safeToContact: "no",
          safeContactNotes: "Email only",
          urgentReason: "OTHER",
          urgentReasonOtherText: "Need help today",
        }),
        true,
        true,
      ),
    ).toBe(true);
  });

  it("allows continuing when a standard urgent reason is selected", () => {
    expect(
      computeCanGoNext(
        makeFormData({
          proceed: "JOIN_DIGITAL_QUEUE",
          urgentReason: "SAFETY_CONCERN",
        }),
        true,
        true,
      ),
    ).toBe(true);
  });

  it("clears dependent enquiry information when resetting the form state", () => {
    expect(
      resetFormInfo(
        makeFormData({
          enquiryId: "homelessness",
          specificDetailId: "detail",
          routedDepartment: "Homelessness",
          householdSize: "4",
          hasChildren: true,
          childrenCount: "2",
          hasDisabilityOrSensory: true,
          disabilityType: "HEARING_IMPAIRMENT",
          ageRange: "AGE_25_34",
          domesticAbuse: true,
          safeToContact: "no",
          safeContactNotes: "Email only",
          appointmentDateIso: "2026-06-20",
          appointmentTime: "10:00",
        }),
      ),
    ).toEqual(
      expect.objectContaining({
        enquiryId: "",
        specificDetailId: "",
        routedDepartment: "",
        householdSize: "",
        hasChildren: false,
        childrenCount: "",
        hasDisabilityOrSensory: false,
        disabilityType: "",
        ageRange: "",
        domesticAbuse: false,
        safeToContact: "PREFER_NOT_TO_SAY",
        safeContactNotes: "",
        appointmentDateIso: "",
        appointmentTime: "",
      }),
    );
  });

  it("auto selects the only enquiry when the top-level area has one option", () => {
    expect(
      applyTopLevelChange(
        makeFormData({
          topLevel: "Housing",
          enquiryId: "homelessness",
          routedDepartment: "Homelessness",
        }),
        "CouncilTax",
      ),
    ).toEqual(
      expect.objectContaining({
        topLevel: "CouncilTax",
        enquiryId: "council_tax",
        routedDepartment: "Council_Tax_Or_Housing_Benefit",
      }),
    );
  });

  it("resets the enquiry choice without auto selecting when the top-level area has multiple options", () => {
    expect(
      applyTopLevelChange(
        makeFormData({
          topLevel: "CouncilTax",
          enquiryId: "council_tax",
          routedDepartment: "Council_Tax_Or_Housing_Benefit",
        }),
        "Housing",
      ),
    ).toEqual(
      expect.objectContaining({
        topLevel: "Housing",
        enquiryId: "",
        routedDepartment: "",
      }),
    );
  });

  it("clears the top-level selection without trying to auto select an enquiry", () => {
    expect(
      applyTopLevelChange(
        makeFormData({
          topLevel: "CouncilTax",
          enquiryId: "council_tax",
          routedDepartment: "Council_Tax_Or_Housing_Benefit",
        }),
        "",
      ),
    ).toEqual(
      expect.objectContaining({
        topLevel: "",
        enquiryId: "",
        routedDepartment: "",
      }),
    );
  });

  it("applies enquiry changes and clears dependent values", () => {
    const enquiryOptions = getEnquiryOptions("Housing");

    expect(
      applyEnquiryChange(
        makeFormData({
          enquiryId: "housing_benefit",
          routedDepartment: "Council_Tax_Or_Housing_Benefit",
          hasChildren: true,
          childrenCount: "2",
          appointmentDateIso: "2026-06-20",
          appointmentTime: "10:00",
        }),
        "homelessness",
        enquiryOptions,
      ),
    ).toEqual(
      expect.objectContaining({
        enquiryId: "homelessness",
        routedDepartment: "Homelessness",
        hasChildren: false,
        childrenCount: "",
        appointmentDateIso: "",
        appointmentTime: "",
      }),
    );
  });

  it("preserves urgent details only when urgency stays yes", () => {
    expect(
      applyUrgencyChange(
        makeFormData({
          urgent: "yes",
          urgentReason: "OTHER",
          urgentReasonOtherText: "Need help today",
        }),
        "yes",
      ),
    ).toEqual(
      expect.objectContaining({
        urgent: "yes",
        urgentReason: "OTHER",
        urgentReasonOtherText: "Need help today",
      }),
    );
    expect(
      applyUrgencyChange(
        makeFormData({
          urgent: "yes",
          urgentReason: "OTHER",
          urgentReasonOtherText: "Need help today",
        }),
        "no",
      ),
    ).toEqual(
      expect.objectContaining({
        urgent: "no",
        urgentReason: "",
        urgentReasonOtherText: "",
      }),
    );
  });

  it("clears appointment details when the proceed option changes", () => {
    expect(
      applyProceedChange(
        makeFormData({
          proceed: "BOOK_APPOINTMENT",
          appointmentDateIso: "2026-06-20",
          appointmentTime: "10:00",
        }),
        "JOIN_DIGITAL_QUEUE",
      ),
    ).toEqual(
      expect.objectContaining({
        proceed: "JOIN_DIGITAL_QUEUE",
        appointmentDateIso: "",
        appointmentTime: "",
      }),
    );
  });

  it("shows support notes only when support choices or notes are present", () => {
    expect(shouldShowSupportNotes(makeFormData())).toBe(false);
    expect(
      shouldShowSupportNotes(
        makeFormData({
          needsAccessibility: true,
        }),
      ),
    ).toBe(true);
    expect(
      shouldShowSupportNotes(
        makeFormData({
          otherSupport: " Something else ",
        }),
      ),
    ).toBe(true);
    expect(
      shouldShowSupportNotes(
        makeFormData({
          supportNotes: " Helpful note ",
        }),
      ),
    ).toBe(true);
  });

  it.each([
    "needsLanguage",
    "needsSeating",
    "needsWrittenUpdates",
    "needsLargeText",
    "needsQuietSpace",
    "needsBSL",
    "needsHelpWithForms",
  ] satisfies Array<keyof FormData>)("shows support notes when %s is selected", (field) => {
    expect(
      shouldShowSupportNotes(
        makeFormData({
          [field]: true,
        }),
      ),
    ).toBe(true);
  });

  it("treats missing support note strings the same as blank ones", () => {
    expect(
      shouldShowSupportNotes({
        ...makeFormData(),
        otherSupport: undefined as unknown as string,
        supportNotes: undefined as unknown as string,
      }),
    ).toBe(false);
  });
});
