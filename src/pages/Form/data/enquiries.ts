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

import type { EnquiryItem } from "../model/formFieldTypes";

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
      selfServiceLinks: [
        { label: "View your Council Tax account", href: "https://www.hounslow.gov.uk/council-tax/view-council-tax-account" },
        { label: "Paying your Council Tax", href: "https://www.hounslow.gov.uk/council-tax/paying-council-tax" },
        { label: "Council Tax Support", href: "https://www.hounslow.gov.uk/council-tax/council-tax-support" },
      ],
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
      selfServiceLinks: [
        { label: "Contact Council Tax (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
        { label: "Problems paying your Council Tax", href: "https://www.hounslow.gov.uk/council-tax/problems-paying-council-tax" },
        { label: "Moving home and Council Tax", href: "https://www.hounslow.gov.uk/council-tax/moving-home-council-tax" },
      ],
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
      selfServiceLinks: [
        { label: "Customer accounts", href: "https://www.hounslow.gov.uk/homepage/1178/customer-accounts" },
        { label: "Council Tax (guide and support)", href: "https://www.hounslow.gov.uk/council-tax" },
        { label: "Benefits and financial support", href: "https://www.hounslow.gov.uk/benefits-financial-support" },
      ],
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
      selfServiceLinks: [
        { label: "Housing Benefit", href: "https://www.hounslow.gov.uk/housing-benefit" },
        { label: "Housing Benefit claim reviews (verification)", href: "https://www.hounslow.gov.uk/housing-benefit/housing-benefit-claim-reviews" },
        { label: "Benefits and financial support", href: "https://www.hounslow.gov.uk/benefits-financial-support" },
      ],
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
      selfServiceLinks: [
        { label: "Problems paying your rent", href: "https://www.hounslow.gov.uk/paying-rent/problems-paying-rent" },
        { label: "Contact Housing (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
        { label: "Housing (service hub)", href: "https://www.hounslow.gov.uk/housing" },
        { label: "Get help if you're facing homelessness", href: "https://www.hounslow.gov.uk/homelessness" },
      ],
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
      selfServiceLinks: [
        { label: "Housing (service hub)", href: "https://www.hounslow.gov.uk/housing" },
        { label: "Problems paying your rent", href: "https://www.hounslow.gov.uk/paying-rent/problems-paying-rent" },
        { label: "Contact Housing (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
      ],
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
      selfServiceLinks: [
        { label: "Housing (service hub)", href: "https://www.hounslow.gov.uk/housing" },
        { label: "Contact Housing (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
        { label: "Problems paying your rent", href: "https://www.hounslow.gov.uk/paying-rent/problems-paying-rent" },
      ],
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
      selfServiceLinks: [
        { label: "Apply for a Blue Badge (GOV.UK)", href: "https://www.gov.uk/apply-blue-badge" },
        { label: "Adult social care financial assessment", href: "https://www.hounslow.gov.uk/money-legal-matters/financial-assessment-adult-social-care" },
        { label: "Contact Adult Social Care (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
      ],
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
      selfServiceLinks: [
        { label: "Freedom Pass (London Councils)", href: "https://www.londoncouncils.gov.uk/services/freedom-pass" },
        { label: "Contact Adult Social Care (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
        { label: "Customer services", href: "https://www.hounslow.gov.uk/customer-services" },
      ],
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
      selfServiceLinks: [
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
        { label: "Customer services", href: "https://www.hounslow.gov.uk/customer-services" },
      ],
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
      selfServiceLinks: [
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
        { label: "Customer services", href: "https://www.hounslow.gov.uk/customer-services" },
      ],
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
      selfServiceLinks: [
        { label: "Community hub and libraries", href: "https://www.hounslow.gov.uk/libraries" },
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
      ],
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
      askAgeQs: true,
    },
    {
      value: "translation",
      label: "Translation",
      department: "Community Hub Advisor",
      selfServiceLinks: [
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
      ],
      askVulnerabilityQs: true,
    },
  ],
};

// The General Services section is split into specific service areas, each with their own enquiries
export const ENQUIRIES_BY_GENERAL_SERVICES_SECTION: Record<string, EnquiryItem[]> = {
  EnvWaste: [
    {
      value: "environment",
      label: "Environment",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Environment", href: "https://www.hounslow.gov.uk/environment" },
        { label: "Report fly-tipping", href: "https://www.hounslow.gov.uk/street-problems/report-fly-tipping-or-illegal-waste-dumping" },
        { label: "Street problems", href: "https://www.hounslow.gov.uk/street-problems" },
      ],
    },
    {
      value: "waste_recycling",
      label: "Waste and recycling",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Waste and recycling", href: "https://www.hounslow.gov.uk/recycling-rubbish" },
        { label: "Collection days", href: "https://www.hounslow.gov.uk/collections/recycling-rubbish-collection-days" },
        { label: "Report a missed collection", href: "https://www.hounslow.gov.uk/recycling-rubbish/report-missed-collection" },
      ],
      specifics: [
        { value: "waste", label: "Waste" },
        { value: "recycling", label: "Recycling" },
      ],
    },
  ],
  RoadsParking: [
    {
      value: "highways",
      label: "Highways",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Street problems", href: "https://www.hounslow.gov.uk/street-problems" },
        { label: "Report a pothole", href: "https://www.hounslow.gov.uk/street-problems/potholes" },
        { label: "Street and traffic lights", href: "https://www.hounslow.gov.uk/roads-streets/street-traffic-lights" },
      ],
    },
    {
      value: "parking",
      label: "Parking",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Parking (service hub)", href: "https://www.hounslow.gov.uk/parking" },
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
        { label: "Customer services", href: "https://www.hounslow.gov.uk/customer-services" },
      ],
      specifics: [
        { value: "permit", label: "Parking permit" },
        { value: "other", label: "Other parking issue" },
      ],
    },
  ],
  PlanBuildLicense: [
    {
      value: "planning",
      label: "Planning",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Search planning applications", href: "https://planning.hounslow.gov.uk/online-applications/" },
        { label: "Planning (service hub)", href: "https://www.hounslow.gov.uk/planning" },
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
      ],
    },
    {
      value: "building_control",
      label: "Building Control",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Building Control (service hub)", href: "https://www.hounslow.gov.uk/building-control" },
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
        { label: "Customer services", href: "https://www.hounslow.gov.uk/customer-services" },
      ],
    },
    {
      value: "licensing",
      label: "Licensing",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Licensing (service hub)", href: "https://www.hounslow.gov.uk/licensing" },
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
        { label: "Council homepage", href: "https://www.hounslow.gov.uk/" },
      ],
    },
  ],
  ParksLeisureLibraries: [
    {
      value: "parks",
      label: "Parks",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Parks and open spaces", href: "https://www.hounslow.gov.uk/parks-open-spaces" },
        { label: "Leisure, parks and sports", href: "https://www.hounslow.gov.uk/leisure-parks-sports" },
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
      ],
    },
    {
      value: "leisure_centres",
      label: "Leisure centres",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Leisure services", href: "https://www.hounslow.gov.uk/leisure-services" },
        { label: "Get active", href: "https://www.hounslow.gov.uk/leisure-parks-sports/get-active" },
        { label: "Leisure, parks and sports", href: "https://www.hounslow.gov.uk/leisure-parks-sports" },
      ],
    },
    {
      value: "libraries",
      label: "Libraries",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Community hub and libraries", href: "https://www.hounslow.gov.uk/libraries" },
        { label: "Join the library", href: "https://www.hounslow.gov.uk/libraries/join-library" },
        { label: "Library catalogue and online account", href: "https://libraries.hounslow.gov.uk/" },
      ],
    },
    {
      value: "allotments",
      label: "Allotments",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Allotments", href: "https://www.hounslow.gov.uk/parks-open-spaces/allotments" },
        { label: "Parks and open spaces", href: "https://www.hounslow.gov.uk/parks-open-spaces" },
        { label: "Leisure, parks and sports", href: "https://www.hounslow.gov.uk/leisure-parks-sports" },
      ],
    },
  ],
  RegistrationCivic: [
    {
      value: "registrars",
      label: "Registrars",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Births, deaths, citizenship and ceremonies", href: "https://www.hounslow.gov.uk/births-deaths-citizenship-ceremonies" },
        { label: "Register a birth", href: "https://www.hounslow.gov.uk/births-3/register-birth" },
        { label: "Order a birth certificate", href: "https://www.hounslow.gov.uk/births-3/order-birth-certificate" },
      ],
    },
    {
      value: "cemeteries",
      label: "Cemeteries",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Cemeteries", href: "https://www.hounslow.gov.uk/cemeteries" },
        { label: "Burials", href: "https://www.hounslow.gov.uk/cemeteries/burials" },
        { label: "Births, deaths, citizenship and ceremonies", href: "https://www.hounslow.gov.uk/births-deaths-citizenship-ceremonies" },
      ],
    },
    {
      value: "elections",
      label: "Elections",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Elections and voting", href: "https://www.hounslow.gov.uk/elections-voting" },
        { label: "Register to vote", href: "https://www.hounslow.gov.uk/elections-voting/register-vote" },
        { label: "Voting by post", href: "https://www.hounslow.gov.uk/elections-voting/voting-post" },
      ],
    },
    {
      value: "members_mps",
      label: "Members and MPs",
      department: "General customer services",
      selfServiceLinks: [
        { label: "Councillors, meetings and minutes", href: "https://www.hounslow.gov.uk/councillors-meetings-minutes" },
        { label: "Meetings, agendas and minutes", href: "https://democraticservices.hounslow.gov.uk/" },
        { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
      ],
      specifics: [
        { value: "member", label: "Councillor (Member)" },
        { value: "mp", label: "Member of Parliament (MP)" },
      ],
    },
  ],
};

// Some enquiries don't fit into any sections but we still want to show them as options within General Services
export const GENERAL_SERVICES_DIRECT_ITEMS: EnquiryItem[] = [
  {
    value: "floorwalker",
    label: "Floorwalker",
    department: "General customer services",
    selfServiceLinks: [
      { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
      { label: "Customer services", href: "https://www.hounslow.gov.uk/customer-services" },
      { label: "Council homepage", href: "https://www.hounslow.gov.uk/" },
    ],
    askVulnerabilityQs: true,
  },
  {
    value: "fraud",
    label: "Fraud",
    department: "General customer services",
    selfServiceLinks: [
      { label: "Fraud", href: "https://www.hounslow.gov.uk/council/fraud" },
      { label: "Report benefit fraud", href: "https://www.hounslow.gov.uk/benefits-financial-support/report-benefit-fraud" },
      { label: "Report tenancy fraud", href: "https://www.hounslow.gov.uk/housing/tenancy-fraud/2" },
    ],
    askDomesticAbuseQs: true,
    askVulnerabilityQs: true,
  },
  {
    value: "complaints",
    label: "Complaints",
    department: "General customer services",
    selfServiceLinks: [
      { label: "Make a complaint or comment", href: "https://www.hounslow.gov.uk/customer-services/make-complaint-comment" },
      { label: "Online complaint form", href: "https://www.hounslow.gov.uk/customer-services/make-complaint-comment/2" },
      { label: "Contact us (online)", href: "https://www.hounslow.gov.uk/customer-services/contact-us" },
    ],
  },
];

const sectionOptions = GENERAL_SERVICES_SECTIONS.map((s) => ({ value: "section:" + s.value, label: s.label }));
const directOptions = GENERAL_SERVICES_DIRECT_ITEMS.map((i) => ({ value: "direct:" + i.value, label: i.label }));

export const GENERAL_SERVICES_CHOICE_OPTIONS = sectionOptions.concat(directOptions);
