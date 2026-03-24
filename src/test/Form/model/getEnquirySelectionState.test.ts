import { describe, expect, it } from "vitest";

import { ENQUIRIES_BY_TOPLEVEL } from "../../../pages/Form/data/enquiries";
import type { FormData } from "../../../pages/Form/model/formFieldTypes";
import { getEnquirySelectionState } from "../../../pages/Form/model/getEnquirySelectionState";
import { initialFormData } from "../../../pages/Form/model/initialState";

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...initialFormData,
    ...overrides,
  };
}

describe("getEnquirySelectionState", () => {
  it("returns empty state when no top-level area has been chosen", () => {
    expect(getEnquirySelectionState(makeFormData())).toEqual({
      enquiryOptions: [],
      selectedEnquiry: null,
      specificOptions: [],
      showSpecificDropdown: false,
      hasChosenEnquiry: false,
      hasSatisfiedSpecific: true,
      hasEnoughToProceed: false,
      showChildrenQs: false,
      showDisabilityQs: false,
      showHouseholdSize: false,
      showDomesticAbuseQs: false,
      showAgeRange: false,
    });
  });

  it("returns the selected enquiry context and derived follow-up flags", () => {
    const state = getEnquirySelectionState(
      makeFormData({
        topLevel: "Housing",
        enquiryId: "homelessness",
      }),
    );

    expect(state.enquiryOptions.map((item) => item.value)).toContain("homelessness");
    expect(state.selectedEnquiry?.label).toBe("Homelessness");
    expect(state.hasChosenEnquiry).toBe(true);
    expect(state.hasEnoughToProceed).toBe(true);
    expect(state.showChildrenQs).toBe(true);
    expect(state.showDisabilityQs).toBe(true);
    expect(state.showHouseholdSize).toBe(true);
    expect(state.showDomesticAbuseQs).toBe(true);
    expect(state.showAgeRange).toBe(true);
  });

  it("hides the age-range question when a date of birth is already present", () => {
    const state = getEnquirySelectionState(
      makeFormData({
        topLevel: "Housing",
        enquiryId: "homelessness",
        dob: "2000-06-01",
      }),
    );

    expect(state.showAgeRange).toBe(false);
  });

  it("marks Childrens Duty as a children-question path before an enquiry is chosen", () => {
    const state = getEnquirySelectionState(
      makeFormData({
        topLevel: "ChildrensDuty",
      }),
    );

    expect(state.hasChosenEnquiry).toBe(false);
    expect(state.showChildrenQs).toBe(true);
    expect(state.hasEnoughToProceed).toBe(false);
  });

  it("requires a specific detail when the selected enquiry has specifics", () => {
    const originalSpecifics = ENQUIRIES_BY_TOPLEVEL.Housing[0]?.specifics;

    ENQUIRIES_BY_TOPLEVEL.Housing[0].specifics = [
      { value: "benefit_change", label: "Benefit change" },
    ];

    try {
      const withoutSpecific = getEnquirySelectionState(
        makeFormData({
          topLevel: "Housing",
          enquiryId: "housing_benefit",
        }),
      );
      const withSpecific = getEnquirySelectionState(
        makeFormData({
          topLevel: "Housing",
          enquiryId: "housing_benefit",
          specificDetailId: "benefit_change",
        }),
      );

      expect(withoutSpecific.showSpecificDropdown).toBe(true);
      expect(withoutSpecific.hasSatisfiedSpecific).toBe(false);
      expect(withoutSpecific.hasEnoughToProceed).toBe(false);
      expect(withSpecific.specificOptions).toEqual([
        { value: "benefit_change", label: "Benefit change" },
      ]);
      expect(withSpecific.hasSatisfiedSpecific).toBe(true);
      expect(withSpecific.hasEnoughToProceed).toBe(true);
    } finally {
      ENQUIRIES_BY_TOPLEVEL.Housing[0].specifics = originalSpecifics;
    }
  });
});
