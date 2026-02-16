/**
 * Works out what options should be shown for the current selections.
 *
 * Given the current FormData, this builds a simple context object used in multiple steps to decide:
 * - Which enquiry is currently selected, and whether it has a "more detail" dropdown.
 * - Whether the current selection is complete enough to move forward.
 * - Which follow-up sections should appear (children, disability/sensory, household size,
 *   domestic abuse).
 */

import type { FormData } from "./types";
import { getEnquiryOptions } from "./step2Logic";

// Determines which options and sections to show based on the current form data
export function getEnquiryContext(data: FormData) {
  const isGeneralServices = data.topLevel === "GeneralServices";
  const generalServicesIsSection =
    isGeneralServices && data.generalServicesChoice !== "" && data.generalServicesChoice.startsWith("section:");

  const enquiryOptions = getEnquiryOptions(data.topLevel, data.generalServicesChoice);
  const selectedEnquiry = enquiryOptions.find((x) => x.value === data.enquiryId) || null;
  const isOther = data.topLevel === "Other";

  const specificOptions = selectedEnquiry?.specifics || [];
  const showSpecificDropdown = !!selectedEnquiry && specificOptions.length > 0;

  const hasChosenEnquiry = data.enquiryId !== "";
  const hasSatisfiedSpecific = !showSpecificDropdown || data.specificDetailId !== "";
  const hasEnoughToProceed = isOther ? data.otherEnquiryText.trim() !== "" : hasChosenEnquiry && hasSatisfiedSpecific;

  const showChildrenQs = data.topLevel === "ChildrensDuty" || !!selectedEnquiry?.askChildrenQs;
  const showDisabilityQs = !!selectedEnquiry?.askVulnerabilityQs;
  const showHouseholdSize = !!selectedEnquiry?.askHouseholdSize;
  const showDomesticAbuseQs = !!selectedEnquiry?.askDomesticAbuseQs;
  const showAgeRange = hasChosenEnquiry && !data.dob && !!selectedEnquiry?.askAgeQs;

  return {
    isGeneralServices,
    generalServicesIsSection,
    enquiryOptions,
    selectedEnquiry,
    specificOptions,
    showSpecificDropdown,
    isOther,
    hasChosenEnquiry,
    hasSatisfiedSpecific,
    hasEnoughToProceed,
    showChildrenQs,
    showDisabilityQs,
    showHouseholdSize,
    showDomesticAbuseQs,
    showAgeRange,
  };
}
