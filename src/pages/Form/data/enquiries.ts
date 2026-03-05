/**
 * The list of services and enquiries used by the triage step.
 *
 * This file drives what residents see in Enquiry Selection:
 * - Top-level service areas.
 * - The enquiries available under each area.
 *
 * Enquiries can also carry flags saying which follow-up questions apply (eg children questions,
 * household size, domestic abuse prompts). These flags are used in multiple steps to decide what to display.
 */

import type { EnquiryItem } from "../model/formFieldTypes";

// Top level areas (mostly departments)
export const TOP_LEVEL: { value: string; label: string }[] = [
  { value: "CouncilTax", label: "Council Tax" },
  { value: "Housing", label: "Housing" },
  { value: "AdultsDuty", label: "Adults Duty" },
  { value: "ChildrensDuty", label: "Childrens Duty" },
  { value: "CommunityHub", label: "Community Hub Advisor" },
  { value: "GeneralServices", label: "General Customer Services" },
  { value: "Other", label: "Other" },
];

// The actual enquiries, grouped by top-level area.
export const ENQUIRIES_BY_TOPLEVEL: Record<string, EnquiryItem[]> = {
  CouncilTax: [
    {
      value: "council_tax",
      label: "Council Tax",
      department: "COUNCIL_TAX_OR_HOUSING_BENEFIT_HELP",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
  ],

  Housing: [
    {
      value: "housing_benefit",
      label: "Housing Benefit",
      department: "COUNCIL_TAX_OR_HOUSING_BENEFIT_HELP",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "homelessness",
      label: "Homelessness",
      department: "HOMELESSNESS",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "collecting_keys",
      label: "Collecting keys",
      department: "HOMELESSNESS",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "repair_query",
      label: "Repair query",
      department: "HOMELESSNESS",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "tenancy_query",
      label: "Tenancy query",
      department: "HOMELESSNESS",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
  ],

  AdultsDuty: [
    {
      value: "assessment",
      label: "Assessment",
      department: "ADULTS_DUTY",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "urgent_support_needs",
      label: "Urgent support needs",
      department: "ADULTS_DUTY",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "safeguarding_concerns",
      label: "Safeguarding concerns",
      department: "ADULTS_DUTY",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "carer_query",
      label: "Carer query",
      department: "ADULTS_DUTY",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
  ],

  ChildrensDuty: [
    {
      value: "child_safety_concerns",
      label: "Child safety concerns concerns",
      department: "CHILDRENS_DUTY",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "conflict",
      label: "Conflict",
      department: "CHILDRENS_DUTY",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
  ],

  CommunityHub: [
    {
      value: "employment",
      label: "Employment",
      department: "COMMUNITY_HUB_ADVISOR",
      askVulnerabilityQs: true,
    },
    {
      value: "volunteering",
      label: "Volunteering",
      department: "COMMUNITY_HUB_ADVISOR",
      askVulnerabilityQs: true,
    },
    {
      value: "financial_support",
      label: "Financial support",
      department: "COMMUNITY_HUB_ADVISOR",
      askVulnerabilityQs: true,
    },
  ],

  GeneralServices: [
    {
      value: "flytipping",
      label: "Flytipping",
      department: "GENERAL_CUSTOMER_SERVICES",
    },
    {
      value: "bin_collection",
      label: "Bin collection",
      department: "GENERAL_CUSTOMER_SERVICES",
    },
    {
      value: "registrations",
      label: "Registrations",
      department: "GENERAL_CUSTOMER_SERVICES",
    },
    {
      value: "parking",
      label: "Parking",
      department: "GENERAL_CUSTOMER_SERVICES",
    },
    {
      value: "blue_badge",
      label: "Blue Badge",
      department: "GENERAL_CUSTOMER_SERVICES",
    },
    {
      value: "freedom_pass",
      label: "Freedom Pass",
      department: "GENERAL_CUSTOMER_SERVICES",
    },
  ],
};
