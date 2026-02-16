/**
 * The list of services and enquiries used by the triage step.
 *
 * This file drives what residents see in Step 2:
 * - Top-level service areas.
 * - The General Services split.
 * - The actual enquiries and any extra "more detail" options.
 *
 * Enquiries can also carry flags saying which follow-up questions apply (eg children questions,
 * household size, domestic abuse prompts). These flags are used in multiple steps to decide what to display.
 *
 * Changes here affect both the UI wording and the behaviour of the form.
 */

import type { EnquiryItem } from "../model/types";

// Top level areas (mostly departments)
export const TOP_LEVEL: { value: string; label: string }[] = [
  { value: "CouncilTax", label: "Council Tax" },
  { value: "Housing", label: "Housing" },
  { value: "AdultsDuty", label: "Support for adults" },
  { value: "ChildrensDuty", label: "Children and families" },
  { value: "CommunityHub", label: "Community Hub and language support" },
  { value: "GeneralServices", label: "Other council services" },
  { value: "Other", label: "Other" },
];

// The General Services section is split into specific service areas, each with their own enquiries 
export const GENERAL_SERVICES_SECTIONS: { value: string; label: string }[] = [
  { value: "EnvWaste", label: "Environment and waste" },
  { value: "RoadsParking", label: "Roads, parking and street issues" },
  { value: "PlanBuildLicense", label: "Planning, building and licensing" },
  { value: "ParksLeisureLibraries", label: "Parks, leisure and libraries" },
  { value: "RegistrationCivic", label: "Registration and civic services" },
];

// The actual enquiries, grouped by top-level area or General Services section. 
// Each enquiry can optionally have "specifics" which are more detailed options shown if the user selects that enquiry
// Enquiries can also have flags saying which follow up questions apply
export const ENQUIRIES_BY_TOPLEVEL: Record<string, EnquiryItem[]> = {
  CouncilTax: [
    {
      value: "council_tax_help",
      label: "Council Tax help",
      department: "Council Tax or Housing Benefit Help",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "council_tax_appointment",
      label: "Council Tax appointment",
      department: "Council Tax or Housing Benefit Help",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "liberata",
      label: "Liberata (payments, bills or letters)",
      department: "Council Tax or Housing Benefit Help",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
  ],
  Housing: [
    {
      value: "housing_benefit_help",
      label: "Housing Benefit help",
      department: "Council Tax or Housing Benefit Help",
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
      value: "voids_lettings",
      label: "Voids and lettings",
      department: "Homelessness",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "housing_issue",
      label: "Housing issue",
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
      value: "blue_badges", 
      label: "Blue Badges", 
      department: "Adults duty", 
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
      
    },
    { 
      value: "freedom_passes", 
      label: "Freedom Passes", 
      department: "Adults duty", 
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
  ],
  ChildrensDuty: [
    {
      value: "child_prot_case_conference",
      label: "Child protection case conference",
      department: "Childrens duty",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "youth_offending_service",
      label: "Youth Offending Service",
      department: "Childrens duty",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
  ],
  CommunityHub: [
    {
      value: "community_hub_advisor",
      label: "Community Hub Advisor",
      department: "Community Hub Advisor",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    { value: "translation", label: "Translation", department: "Community Hub Advisor", askVulnerabilityQs: true },
  ],
};

// The General Services section is split into specific service areas, each with their own enquiries
export const ENQUIRIES_BY_GENERAL_SERVICES_SECTION: Record<string, EnquiryItem[]> = {
  EnvWaste: [
    { value: "environment", label: "Environment", department: "General customer services" },
    {
      value: "waste_recycling",
      label: "Waste and recycling",
      department: "General customer services",
      specifics: [
        { value: "waste", label: "Waste" },
        { value: "recycling", label: "Recycling" },
      ],
    },
  ],
  RoadsParking: [
    { value: "highways", label: "Highways", department: "General customer services" },
    {
      value: "parking",
      label: "Parking",
      department: "General customer services",
      specifics: [
        { value: "permit", label: "Parking permit" },
        { value: "other", label: "Other parking issue" },
      ],
    },
  ],
  PlanBuildLicense: [
    { value: "planning", label: "Planning", department: "General customer services" },
    { value: "building_control", label: "Building Control", department: "General customer services" },
    { value: "licensing", label: "Licensing", department: "General customer services" },
  ],
  ParksLeisureLibraries: [
    { value: "parks", label: "Parks", department: "General customer services" },
    { value: "leisure_centres", label: "Leisure centres", department: "General customer services" },
    { value: "libraries", label: "Libraries", department: "General customer services" },
    { value: "allotments", label: "Allotments", department: "General customer services" },
  ],
  RegistrationCivic: [
    { value: "registrars", label: "Registrars", department: "General customer services" },
    { value: "cemeteries", label: "Cemeteries", department: "General customer services" },
    { value: "elections", label: "Elections", department: "General customer services" },
    {
      value: "members_mps",
      label: "Members and MPs",
      department: "General customer services",
      specifics: [
        { value: "member", label: "Councillor (Member)" },
        { value: "mp", label: "Member of Parliament (MP)" },
      ],
    },
  ],
};

// Some enquiries don't fit into any sections but we still want to show them as options within General Services
export const GENERAL_SERVICES_DIRECT_ITEMS: EnquiryItem[] = [
  { value: "floorwalker", label: "Floorwalker", department: "General customer services", askVulnerabilityQs: true },
  {
    value: "fraud",
    label: "Fraud",
    department: "General customer services",
    askDomesticAbuseQs: true,
    askVulnerabilityQs: true,
  },
  { value: "complaints", label: "Complaints", department: "General customer services" },
];

const sectionOptions = GENERAL_SERVICES_SECTIONS.map((s) => ({ value: "section:" + s.value, label: s.label }));
const directOptions = GENERAL_SERVICES_DIRECT_ITEMS.map((i) => ({ value: "direct:" + i.value, label: i.label }));

export const GENERAL_SERVICES_CHOICE_OPTIONS = sectionOptions.concat(directOptions);
