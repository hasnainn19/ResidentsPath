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
];

// The actual enquiries, grouped by top-level area.
export const ENQUIRIES_BY_TOPLEVEL: Record<string, EnquiryItem[]> = {
  CouncilTax: [
    {
      value: "council_tax",
      label: "Council Tax",
      department: "Council_Tax_Or_Housing_Benefit",
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
      department: "Council_Tax_Or_Housing_Benefit",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "homelessness",
      label: "Homelessness",
      department: "Homelessness",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "collecting_keys",
      label: "Collecting keys",
      department: "Homelessness",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "repair_query",
      label: "Repair query",
      department: "Homelessness",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "tenancy_query",
      label: "Tenancy query",
      department: "Homelessness",
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
      department: "Adults_Duty",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "urgent_support_needs",
      label: "Urgent support needs",
      department: "Adults_Duty",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "safeguarding_concerns",
      label: "Safeguarding concerns",
      department: "Adults_Duty",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "carer_query",
      label: "Carer query",
      department: "Adults_Duty",
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
      label: "Child safety concerns",
      department: "Childrens_Duty",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "conflict",
      label: "Conflict",
      department: "Childrens_Duty",
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
      department: "Community_Hub_Advisor",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "volunteering",
      label: "Volunteering",
      department: "Community_Hub_Advisor",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "financial_support",
      label: "Financial support",
      department: "Community_Hub_Advisor",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
  ],

  GeneralServices: [
    {
      value: "fly-tipping",
      label: "Fly-tipping",
      department: "General_Customer_Services",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "bin_collection",
      label: "Bin collection",
      department: "General_Customer_Services",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "registrations",
      label: "Registrations",
      department: "General_Customer_Services",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "parking",
      label: "Parking",
      department: "General_Customer_Services",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "blue_badge",
      label: "Blue Badge",
      department: "General_Customer_Services",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "freedom_pass",
      label: "Freedom Pass",
      department: "General_Customer_Services",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
  ],
};
