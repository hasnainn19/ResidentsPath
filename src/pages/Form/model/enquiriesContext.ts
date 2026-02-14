import type { FormData } from "./types";
import { getEnquiryOptions } from "./step2Logic";

export function getEnquiryContext(data: FormData) {
  const isGeneralServices = data.topLevel === "GeneralServices";
  const generalServicesIsSection =
    isGeneralServices && data.generalServicesChoice !== "" && data.generalServicesChoice.startsWith("section:");

  const enquiryOptions = getEnquiryOptions(data.topLevel, data.generalServicesChoice);
  const selectedEnquiry = enquiryOptions.find((x) => x.value === data.enquiryId) || null;

  const specificOptions = selectedEnquiry?.specifics || [];
  const showSpecificDropdown = !!selectedEnquiry && specificOptions.length > 0;

  const hasChosenEnquiry = data.enquiryId !== "";
  const hasSatisfiedSpecific = !showSpecificDropdown || data.specificDetailId !== "";
  const hasEnoughToProceed = hasChosenEnquiry && hasSatisfiedSpecific;

  const showChildrenQs = data.topLevel === "ChildrensDuty" || !!selectedEnquiry?.askChildrenQs;
  const showDisabilityQs = !!selectedEnquiry?.askVulnerabilityQs;
  const showHouseholdSize = !!selectedEnquiry?.askHouseholdSize;
  const showDomesticAbuseQs = !!selectedEnquiry?.askDomesticAbuseQs;

  return {
    isGeneralServices,
    generalServicesIsSection,
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
  };
}
