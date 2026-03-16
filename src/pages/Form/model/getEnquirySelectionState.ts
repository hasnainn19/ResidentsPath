/**
 * Works out what options should be shown for the current selections.
 *
 * Given the current FormData, this builds a simple context object used in multiple steps to decide:
 * - Which enquiry is currently selected, and whether it has a "more detail" dropdown.
 * - Whether the current selection is complete enough to move forward.
 * - Which follow-up sections should appear (children, disability/sensory, household size,
 *   domestic abuse).
 */

import type { FormData } from "./formFieldTypes";
import { getEnquiryOptions } from "./enquirySelectionLogic";

// Determines which options and sections to show based on the current form data
export function getEnquirySelectionState(data: FormData) {
  const topLevel = data.topLevel;

  const enquiryOptions = getEnquiryOptions(topLevel);
  const selectedEnquiry = enquiryOptions.find((x) => x.value === data.enquiryId) || null;

  const hasChosenEnquiry = data.enquiryId !== "";

  const specificOptions = selectedEnquiry?.specifics ?? [];
  const showSpecificDropdown = specificOptions.length > 0;

  const hasSatisfiedSpecific = !showSpecificDropdown || data.specificDetailId !== "";
  const hasEnoughToProceed = hasChosenEnquiry && hasSatisfiedSpecific;

  const showChildrenQs = topLevel === "ChildrensDuty" || selectedEnquiry?.askChildrenQs === true;
  const showDisabilityQs = selectedEnquiry?.askVulnerabilityQs === true;
  const showHouseholdSize = selectedEnquiry?.askHouseholdSize === true;
  const showDomesticAbuseQs = selectedEnquiry?.askDomesticAbuseQs === true;
  const showAgeRange = hasChosenEnquiry && !data.dob && selectedEnquiry?.askAgeQs === true;

  return {
    enquiryOptions,
    selectedEnquiry,
    specificOptions,
    showSpecificDropdown,
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
