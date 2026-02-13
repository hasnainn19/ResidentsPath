import { useState, type ReactNode, useId } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Radio,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MicIcon from "@mui/icons-material/Mic";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type Urgency = "yes" | "no" | "unsure";
type SafeToContact = "yes" | "no" | "prefer_not_to_say";

type Proceed = "" | "Join digital queue" | "Schedule appointment" | "Request callback";
type ContactMethod = "" | "Text message" | "Phone call" | "Email" | "Letter";

type Count = "1" | "2" | "3" | "4" | "5" | "6+";
type HouseholdSize = "" | "1" | "2" | "3" | "4" | "5" | "6+" | "Prefer not to say";

type DisabilityType =
  | ""
  | "Mobility impairment"
  | "Visual impairment"
  | "Hearing impairment"
  | "Cognitive / learning"
  | "Mental health"
  | "Other"
  | "Prefer not to say";

type Department =
  | "Council Tax or Housing Benefit Help"
  | "Homelessness"
  | "Adults duty"
  | "Childrens duty"
  | "Community Hub Advisor"
  | "General customer services";

type SpecificOption = { value: string; label: string };

type EnquiryItem = {
  value: string;
  label: string;
  department: Department;
  specifics?: SpecificOption[];

  askChildrenQs?: boolean;
  askVulnerabilityQs?: boolean;
  askHouseholdSize?: boolean;
  askDomesticAbuseQs?: boolean;
};

type LanguageOption = { code: string; label: string };
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "cy", label: "Cymraeg" },
  { code: "pl", label: "Polski" },
  { code: "ur", label: "اردو" },
];

const TOP_LEVEL: { value: string; label: string }[] = [
  { value: "CouncilTax", label: "Council Tax" },
  { value: "Housing", label: "Housing" },
  { value: "AdultsDuty", label: "Support for adults" },
  { value: "ChildrensDuty", label: "Children and families" },
  { value: "CommunityHub", label: "Community Hub and language support" },
  { value: "GeneralServices", label: "Other council services" },
];

const GENERAL_SERVICES_SECTIONS: { value: string; label: string }[] = [
  { value: "EnvWaste", label: "Environment and waste" },
  { value: "RoadsParking", label: "Roads, parking and street issues" },
  { value: "PlanBuildLicense", label: "Planning, building and licensing" },
  { value: "ParksLeisureLibraries", label: "Parks, leisure and libraries" },
  { value: "RegistrationCivic", label: "Registration and civic services" },
];

const ENQUIRIES_BY_TOPLEVEL: Record<string, EnquiryItem[]> = {
  CouncilTax: [
    {
      value: "council_tax_help",
      label: "Council Tax help",
      department: "Council Tax or Housing Benefit Help",
      askHouseholdSize: true,
      askChildrenQs: true,
    },
    {
      value: "council_tax_appointment",
      label: "Council Tax appointment",
      department: "Council Tax or Housing Benefit Help",
      askHouseholdSize: true,
      askChildrenQs: true,
    },
    {
      value: "liberata",
      label: "Liberata (payments, bills or letters)",
      department: "Council Tax or Housing Benefit Help",
      askHouseholdSize: true,
      askChildrenQs: true,
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
    },
    {
      value: "homelessness",
      label: "Homelessness",
      department: "Homelessness",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
    },
    {
      value: "voids_lettings",
      label: "Voids and lettings",
      department: "Homelessness",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
    },
    {
      value: "housing_issue",
      label: "Housing issue",
      department: "Homelessness",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
    },
  ],
  AdultsDuty: [
    { value: "blue_badges", label: "Blue Badges", department: "Adults duty", askVulnerabilityQs: true },
    { value: "freedom_passes", label: "Freedom Passes", department: "Adults duty", askVulnerabilityQs: true },
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
    },
    {
      value: "youth_offending_service",
      label: "Youth Offending Service",
      department: "Childrens duty",
      askVulnerabilityQs: true,
      askHouseholdSize: true,
      askDomesticAbuseQs: true,
      askChildrenQs: true,
    },
  ],
  CommunityHub: [
    {
      value: "community_hub_advisor",
      label: "Community Hub Advisor",
      department: "Community Hub Advisor",
      askVulnerabilityQs: true,
      askDomesticAbuseQs: true,
    },
    { value: "translation", label: "Translation", department: "Community Hub Advisor", askVulnerabilityQs: true },
  ],
};

const ENQUIRIES_BY_GENERAL_SERVICES_SECTION: Record<string, EnquiryItem[]> = {
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

const GENERAL_SERVICES_DIRECT_ITEMS: EnquiryItem[] = [
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

const sectionOptions = GENERAL_SERVICES_SECTIONS.map((s) => {
  return { value: "section:" + s.value, label: s.label };
});

const directOptions = GENERAL_SERVICES_DIRECT_ITEMS.map((i) => {
  return { value: "direct:" + i.value, label: i.label };
});

const GENERAL_SERVICES_CHOICE_OPTIONS = sectionOptions.concat(directOptions);

type FormData = {
  language: string;

  topLevel: string;
  generalServicesChoice: string;

  enquiryId: string;
  specificDetailId: string;
  routedDepartment: "" | Department;

  hasChildren: boolean;
  childrenCount: Count;

  hasDisabilityOrSensory: boolean;
  disabilityType: DisabilityType;

  householdSize: HouseholdSize;

  domesticAbuse: boolean;
  safeToContact: SafeToContact;
  safeContactNotes: string;

  urgent: Urgency;
  urgentReason: string;
  urgentOtherReason: string;

  additionalInfo: string;

  proceed: Proceed;

  needsAccessibility: boolean;
  needsLanguage: boolean;

  needsSeating: boolean;
  needsWrittenUpdates: boolean;
  needsLargeText: boolean;
  needsQuietSpace: boolean;
  needsBSL: boolean;
  needsHelpWithForms: boolean;
  otherSupport: string;

  contactMethod: ContactMethod;
};

const DISABILITY_SUPPORT_RESET = {
  needsSeating: false,
  needsWrittenUpdates: false,
  needsLargeText: false,
  needsQuietSpace: false,
  needsBSL: false,
  needsHelpWithForms: false,
  otherSupport: "",
};

const ALL_SUPPORT_RESET = {
  needsAccessibility: false,
  needsLanguage: false,
  ...DISABILITY_SUPPORT_RESET,
};

function LeftCheckRow(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
      <Checkbox
        id={id}
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        sx={{ mt: 0.25, mr: 1, p: 0 }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography component="label" htmlFor={id} sx={{ mt: 0.45, textAlign: "left", cursor: "pointer" }}>
          {props.label}
        </Typography>
        {props.children}
      </Box>
    </Box>
  );
}

function getEnquiryOptions(topLevel: string, choice: string): EnquiryItem[] {
  if (!topLevel) return [];

  if (topLevel !== "GeneralServices") {
    return ENQUIRIES_BY_TOPLEVEL[topLevel] || [];
  }

  if (!choice) return [];

  if (choice.startsWith("section:")) {
    const sectionId = choice.replace("section:", "");
    return ENQUIRIES_BY_GENERAL_SERVICES_SECTION[sectionId] || [];
  }

  if (choice.startsWith("direct:")) {
    const id = choice.replace("direct:", "");
    return GENERAL_SERVICES_DIRECT_ITEMS.filter((x) => x.value === id);
  }

  return [];
}

function computeCanGoNext(data: FormData, hasEnoughToProceed: boolean, needsUrgentReason: boolean) {
  if (!hasEnoughToProceed) return false;
  if (data.proceed === "") return false;
  if (data.contactMethod === "") return false;
  if (needsUrgentReason && data.urgentReason === "") return false;
  if (needsUrgentReason && data.urgentReason === "Other" && data.urgentOtherReason.trim() === "") return false;
  return true;
}

function resetFormInfo(prev: FormData): FormData {
  return {
    ...prev,
    enquiryId: "",
    specificDetailId: "",
    routedDepartment: "",

    householdSize: "",

    hasChildren: false,
    childrenCount: "1",

    hasDisabilityOrSensory: false,
    disabilityType: "",

    domesticAbuse: false,
    safeToContact: "prefer_not_to_say",
    safeContactNotes: "",

    ...DISABILITY_SUPPORT_RESET,
  };
}

export default function Step2() {
  const nav = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    language: "en",

    topLevel: "",
    generalServicesChoice: "",

    enquiryId: "",
    specificDetailId: "",
    routedDepartment: "",

    hasChildren: false,
    childrenCount: "1",

    hasDisabilityOrSensory: false,
    disabilityType: "",

    householdSize: "",

    domesticAbuse: false,
    safeToContact: "prefer_not_to_say",
    safeContactNotes: "",

    urgent: "unsure",
    urgentReason: "",
    urgentOtherReason: "",

    additionalInfo: "",

    proceed: "",

    needsAccessibility: false,
    needsLanguage: false,

    needsSeating: false,
    needsWrittenUpdates: false,
    needsLargeText: false,
    needsQuietSpace: false,
    needsBSL: false,
    needsHelpWithForms: false,
    otherSupport: "",

    contactMethod: "",
  });

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // TODO(BACKEND): Replace with Text-to-Speech
  const handleListenAll = () => alert("Reading instructions (mock)");

  // TODO(BACKEND): Replace with Speech-to-Text
  const handleVoiceInput = () => alert("Voice input started (mock)");

  // TODO(BACKEND)
  const handleSave = () => alert("Saved (mock)");

  // TODO(BACKEND)
  const submitToBackend = () => {
    const payload = {
      ...formData,
      childrenCount: formData.hasChildren ? formData.childrenCount : "0",
      disabilityType: formData.hasDisabilityOrSensory ? formData.disabilityType : "",
      urgentOtherReason: formData.urgentReason === "Other" ? formData.urgentOtherReason : "",
    };
    console.log(payload);
    alert("Submitted (mock)");
  };

  const isGeneralServices = formData.topLevel === "GeneralServices";
  const generalServicesIsSection =
    isGeneralServices && formData.generalServicesChoice !== "" && formData.generalServicesChoice.startsWith("section:");

  const enquiryOptions = getEnquiryOptions(formData.topLevel, formData.generalServicesChoice);
  const selectedEnquiry = enquiryOptions.find((x) => x.value === formData.enquiryId) || null;

  const specificOptions = selectedEnquiry?.specifics || [];
  const showSpecificDropdown = !!selectedEnquiry && specificOptions.length > 0;

  const hasChosenEnquiry = formData.enquiryId !== "";
  const hasSatisfiedSpecific = !showSpecificDropdown || formData.specificDetailId !== "";
  const hasEnoughToProceed = hasChosenEnquiry && hasSatisfiedSpecific;

  const showChildrenQs = formData.topLevel === "ChildrensDuty" || !!selectedEnquiry?.askChildrenQs;
  const showDisabilityQs = !!selectedEnquiry?.askVulnerabilityQs;
  const showHouseholdSize = !!selectedEnquiry?.askHouseholdSize;
  const showDomesticAbuseQs = !!selectedEnquiry?.askDomesticAbuseQs;

  const showSupportNeeds = formData.proceed === "Join digital queue" || formData.proceed === "Schedule appointment";
  const needsUrgentReason = formData.urgent === "yes";

  const canGoNext = computeCanGoNext(formData, hasEnoughToProceed, needsUrgentReason);

  function handleTopLevelChange(nextTopLevel: string) {
    setFormData((prev) => {
      const next = resetFormInfo({
        ...prev,
        topLevel: nextTopLevel,
        generalServicesChoice: "",
      });
      return next;
    });
  }

  function handleGeneralServicesChoiceChange(nextChoice: string) {
    setFormData((prev): FormData => {
      const nextState = resetFormInfo({ ...prev, generalServicesChoice: nextChoice });

      if (nextChoice.startsWith("direct:")) {
        const id = nextChoice.replace("direct:", "");
        const match = GENERAL_SERVICES_DIRECT_ITEMS.find((x) => x.value === id);

        return {
          ...nextState,
          enquiryId: id,
          routedDepartment: (match?.department ?? "") as "" | Department,
        };
      }

      return nextState;
    });
  }

  function handleEnquiryChange(nextId: string) {
    const match = enquiryOptions.find((x) => x.value === nextId) || null;

    setFormData((prev) => ({
      ...prev,
      enquiryId: nextId,
      specificDetailId: "",
      routedDepartment: match?.department ?? "",

      householdSize: "",
      hasChildren: false,
      childrenCount: "1",

      hasDisabilityOrSensory: false,
      disabilityType: "",

      domesticAbuse: false,
      safeToContact: "prefer_not_to_say",
      safeContactNotes: "",

      ...DISABILITY_SUPPORT_RESET,
    }));
  }

  function setUrgency(value: Urgency) {
    setFormData((prev) => ({
      ...prev,
      urgent: value,
      urgentReason: value === "yes" ? prev.urgentReason : "",
      urgentOtherReason: value === "yes" ? prev.urgentOtherReason : "",
    }));
  }

  function handleProceedChange(next: Proceed) {
    setFormData((prev) => {
      if (next === "Request callback") return { ...prev, proceed: next, ...ALL_SUPPORT_RESET };
      return { ...prev, proceed: next };
    });
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Paper variant="outlined" sx={{ p: 6, borderWidth: 2, borderRadius: 2, bgcolor: "background.paper" }}>
          {/* Listen to instructions */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Button type="button" variant="text" onClick={() => nav("/form/step-1")} sx={{ textTransform: "none" }}>
              {"<-"} Back
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={<VolumeUpIcon />}
              onClick={handleListenAll}
              sx={{ textTransform: "none", color: "primary.main" }}
            >
              Listen to instructions
            </Button>
          </Stack>

          {/* Header row: title and language select */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Council service request
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please complete this form to help us support you today
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="lang-label">Language</InputLabel>
              <Select
                labelId="lang-label"
                label="Language"
                value={formData.language}
                onChange={(e) => setField("language", String(e.target.value))}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.code} value={opt.code}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Progress indicator */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight={700}>
                Step 2 of 3: Request details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                66% complete
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={66} />
          </Paper>

          {/* Main form card */}
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!canGoNext) return;
                submitToBackend();
              }}
            >
              <Stack spacing={4}>
                {/* Service */}
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    What do you need help with?{" "}
                    <Typography component="span" color="error">
                      *
                    </Typography>
                  </Typography>

                  <FormControl fullWidth required>
                    <InputLabel id="top-label">Select an area...</InputLabel>
                    <Select
                      labelId="top-label"
                      label="Select an area..."
                      value={formData.topLevel}
                      onChange={(e) => handleTopLevelChange(String(e.target.value))}
                    >
                      <MenuItem value="">Select an area...</MenuItem>
                      {TOP_LEVEL.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Further information */}
                {isGeneralServices && formData.topLevel !== "" && (
                  <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                    <Typography fontWeight={700} sx={{ mb: 1 }}>
                      Choose a topic{" "}
                      <Typography component="span" color="error">
                        *
                      </Typography>
                    </Typography>

                    <FormControl fullWidth required>
                      <InputLabel id="general-services-choice-label">Select a topic...</InputLabel>
                      <Select
                        labelId="general-services-choice-label"
                        label="Select a topic..."
                        value={formData.generalServicesChoice}
                        onChange={(e) => handleGeneralServicesChoiceChange(String(e.target.value))}
                      >
                        <MenuItem value="">Select a topic...</MenuItem>
                        {GENERAL_SERVICES_CHOICE_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {formData.topLevel !== "" &&
                  (!isGeneralServices || (formData.generalServicesChoice !== "" && generalServicesIsSection)) && (
                    <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                      <Typography fontWeight={700} sx={{ mb: 1 }}>
                        Choose an enquiry{" "}
                        <Typography component="span" color="error">
                          *
                        </Typography>
                      </Typography>

                      <FormControl fullWidth required>
                        <InputLabel id="enquiry-label">Select an enquiry...</InputLabel>
                        <Select
                          labelId="enquiry-label"
                          label="Select an enquiry..."
                          value={formData.enquiryId}
                          onChange={(e) => handleEnquiryChange(String(e.target.value))}
                        >
                          <MenuItem value="">Select an enquiry...</MenuItem>
                          {enquiryOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}

                {hasChosenEnquiry && showSpecificDropdown && (
                  <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                    <Typography fontWeight={700} sx={{ mb: 1 }}>
                      More detail{" "}
                      <Typography component="span" color="error">
                        *
                      </Typography>
                    </Typography>

                    <FormControl fullWidth required>
                      <InputLabel id="detail-label">Select a detail...</InputLabel>
                      <Select
                        labelId="detail-label"
                        label="Select a detail..."
                        value={formData.specificDetailId}
                        onChange={(e) => setField("specificDetailId", String(e.target.value))}
                      >
                        <MenuItem value="">Select a detail...</MenuItem>
                        {specificOptions.map((d) => (
                          <MenuItem key={d.value} value={d.value}>
                            {d.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )}

                {hasEnoughToProceed && (showChildrenQs || showDisabilityQs) && (
                  <>
                    {/* Children */}
                    {showChildrenQs && (
                      <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                        <LeftCheckRow
                          checked={formData.hasChildren}
                          onChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              hasChildren: checked,
                              childrenCount: "1",
                            }))
                          }
                          label="I have dependent children"
                        >
                          {formData.hasChildren && (
                            <Box sx={{ mt: 1 }}>
                              <FormControl fullWidth>
                                <InputLabel id="children-count-label">How many children?</InputLabel>
                                <Select
                                  labelId="children-count-label"
                                  label="How many children?"
                                  value={formData.childrenCount}
                                  onChange={(e) => setField("childrenCount", String(e.target.value) as Count)}
                                >
                                  <MenuItem value="1">1</MenuItem>
                                  <MenuItem value="2">2</MenuItem>
                                  <MenuItem value="3">3</MenuItem>
                                  <MenuItem value="4">4</MenuItem>
                                  <MenuItem value="5">5</MenuItem>
                                  <MenuItem value="6+">6+</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>
                          )}
                        </LeftCheckRow>
                      </Box>
                    )}

                    {/* Disability */}
                    {showDisabilityQs && (
                      <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                        <LeftCheckRow
                          checked={formData.hasDisabilityOrSensory}
                          onChange={(checked) =>
                            setFormData((prev) =>
                              checked
                                ? { ...prev, hasDisabilityOrSensory: true }
                                : {
                                    ...prev,
                                    hasDisabilityOrSensory: false,
                                    disabilityType: "",
                                    ...DISABILITY_SUPPORT_RESET,
                                  },
                            )
                          }
                          label="I have a disability or sensory impairment"
                        >
                          {formData.hasDisabilityOrSensory && (
                            <Box sx={{ mt: 1 }}>
                              <FormControl fullWidth>
                                <InputLabel id="disability-type-label">Select a type...</InputLabel>
                                <Select
                                  labelId="disability-type-label"
                                  label="Select a type..."
                                  value={formData.disabilityType}
                                  onChange={(e) => setField("disabilityType", String(e.target.value) as DisabilityType)}
                                >
                                  <MenuItem value="">Select...</MenuItem>
                                  <MenuItem value="Mobility impairment">Mobility impairment</MenuItem>
                                  <MenuItem value="Visual impairment">Visual impairment</MenuItem>
                                  <MenuItem value="Hearing impairment">Hearing impairment</MenuItem>
                                  <MenuItem value="Cognitive / learning">Cognitive / learning</MenuItem>
                                  <MenuItem value="Mental health">Mental health</MenuItem>
                                  <MenuItem value="Other">Other</MenuItem>
                                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>
                          )}
                        </LeftCheckRow>
                      </Box>
                    )}
                  </>
                )}

                {hasEnoughToProceed && showHouseholdSize && (
                  <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel id="household-label">How many people are in your household?</InputLabel>
                      <Select
                        labelId="household-label"
                        label="How many people are in your household?"
                        value={formData.householdSize}
                        onChange={(e) => setField("householdSize", String(e.target.value) as HouseholdSize)}
                      >
                        <MenuItem value="">Select...</MenuItem>
                        <MenuItem value="1">1</MenuItem>
                        <MenuItem value="2">2</MenuItem>
                        <MenuItem value="3">3</MenuItem>
                        <MenuItem value="4">4</MenuItem>
                        <MenuItem value="5">5</MenuItem>
                        <MenuItem value="6+">6+</MenuItem>
                        <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                      </Select>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        People who usually live with you (including you).
                      </Typography>
                    </FormControl>
                  </Box>
                )}

                {hasEnoughToProceed && showDomesticAbuseQs && (
                  <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                    <LeftCheckRow
                      checked={formData.domesticAbuse}
                      onChange={(checked) =>
                        setFormData((prev) =>
                          checked
                            ? { ...prev, domesticAbuse: true }
                            : {
                                ...prev,
                                domesticAbuse: false,
                                safeToContact: "prefer_not_to_say",
                                safeContactNotes: "",
                              },
                        )
                      }
                      label="I am a domestic abuse victim/survivor"
                    >
                      {formData.domesticAbuse && (
                        <Box sx={{ mt: 1.5 }}>
                          <Stack spacing={2}>
                            <FormControl fullWidth>
                              <InputLabel id="safe-contact-label">Is it safe for us to contact you?</InputLabel>
                              <Select
                                labelId="safe-contact-label"
                                label="Is it safe for us to contact you?"
                                value={formData.safeToContact}
                                onChange={(e) => setField("safeToContact", String(e.target.value) as SafeToContact)}
                              >
                                <MenuItem value="yes">Yes</MenuItem>
                                <MenuItem value="no">No</MenuItem>
                                <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                              </Select>
                            </FormControl>

                            {formData.safeToContact === "no" && (
                              <TextField
                                fullWidth
                                label="Safe contact notes (optional)"
                                placeholder="Safe time or method, or do not contact"
                                value={formData.safeContactNotes}
                                onChange={(e) => setField("safeContactNotes", e.target.value)}
                              />
                            )}
                          </Stack>
                        </Box>
                      )}
                    </LeftCheckRow>
                  </Box>
                )}

                {/* Urgency */}
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    Do you need support sooner today?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    For example: a safety concern, nowhere safe to stay tonight, health or mobility needs, or something
                    time-limited today.
                  </Typography>

                  <Stack spacing={1}>
                    {(
                      [
                        ["yes", "Yes"],
                        ["no", "No"],
                        ["unsure", "Not sure"],
                      ] as const
                    ).map(([value, label]) => {
                      const checked = formData.urgent === value;
                      return (
                        <Paper
                          key={value}
                          variant="outlined"
                          sx={{ p: 1.25, borderRadius: 1 }}
                          onClick={() => setUrgency(value)}
                          role="radio"
                          aria-checked={checked}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setUrgency(value);
                            }
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Radio checked={checked} onChange={() => setUrgency(value)} sx={{ p: 0.5 }} />
                            <Typography sx={{ ml: 1 }}>{label}</Typography>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>

                  {needsUrgentReason && (
                    <Box sx={{ mt: 2, borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                      <Typography fontWeight={700} sx={{ mb: 1 }}>
                        What best describes why?{" "}
                        <Typography component="span" color="error">
                          *
                        </Typography>
                      </Typography>

                      <FormControl fullWidth required>
                        <InputLabel id="urgent-reason-label">Select a reason...</InputLabel>
                        <Select
                          labelId="urgent-reason-label"
                          label="Select a reason..."
                          value={formData.urgentReason}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const nextReason = String(e.target.value);
                              return {
                                ...prev,
                                urgentReason: nextReason,
                                urgentOtherReason: nextReason === "Other" ? prev.urgentOtherReason : "",
                              };
                            })
                          }
                        >
                          <MenuItem value="">Select a reason...</MenuItem>
                          <MenuItem value="Safety concern">Safety concern</MenuItem>
                          <MenuItem value="No safe place to stay tonight">No safe place to stay tonight</MenuItem>
                          <MenuItem value="Health or mobility">Health or mobility</MenuItem>
                          <MenuItem value="Time-limited today">Time-limited today</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>

                      {formData.urgentReason === "Other" && (
                        <Box sx={{ mt: 2 }}>
                          <TextField
                            fullWidth
                            required
                            multiline
                            minRows={3}
                            label="Please tell us why"
                            placeholder="Briefly describe why you need support sooner today"
                            value={formData.urgentOtherReason}
                            onChange={(e) => setField("urgentOtherReason", e.target.value)}
                          />
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Additional info */}
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    Anything else you want to tell us{" "}
                    <Typography component="span" variant="body2" color="text.secondary">
                      (optional)
                    </Typography>
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    placeholder="Add any details that might help us support you..."
                    value={formData.additionalInfo}
                    onChange={(e) => setField("additionalInfo", e.target.value)}
                  />

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                    <MicIcon fontSize="small" />
                    <Button type="button" size="small" onClick={handleVoiceInput} sx={{ textTransform: "none" }}>
                      Voice input (mock)
                    </Button>
                  </Stack>
                </Box>

                {/* Proceed */}
                <Box sx={{ pt: 2 }}>
                  <Divider sx={{ mb: 3 }} />

                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    How would you like to proceed?{" "}
                    <Typography component="span" color="error">
                      *
                    </Typography>
                  </Typography>

                  <FormControl fullWidth required>
                    <InputLabel id="proceed-label">Select an option...</InputLabel>
                    <Select
                      labelId="proceed-label"
                      label="Select an option..."
                      value={formData.proceed}
                      onChange={(e) => handleProceedChange(String(e.target.value) as Proceed)}
                    >
                      <MenuItem value="">Select an option...</MenuItem>
                      <MenuItem value="Join digital queue">Join the digital queue</MenuItem>
                      <MenuItem value="Schedule appointment">Book an appointment</MenuItem>
                      <MenuItem value="Request callback">Request a callback</MenuItem>
                    </Select>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      We may suggest a quicker online or self-service option if available.
                    </Typography>
                  </FormControl>
                </Box>

                {/* Support options */}
                {showSupportNeeds && (
                  <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                    <Typography fontWeight={700} sx={{ mb: 1 }}>
                      Support needs (optional)
                    </Typography>

                    <Stack spacing={1.25}>
                      <LeftCheckRow
                        checked={formData.needsAccessibility}
                        onChange={(checked) => setField("needsAccessibility", checked)}
                        label="Accessibility support (for example: step-free access, hearing loop)"
                      />
                      <LeftCheckRow
                        checked={formData.needsLanguage}
                        onChange={(checked) => setField("needsLanguage", checked)}
                        label="Language support / interpretation"
                      />

                      {formData.hasDisabilityOrSensory && (
                        <>
                          <LeftCheckRow
                            checked={formData.needsSeating}
                            onChange={(c) => setField("needsSeating", c)}
                            label="Seating (cannot stand for long)"
                          />
                          <LeftCheckRow
                            checked={formData.needsWrittenUpdates}
                            onChange={(c) => setField("needsWrittenUpdates", c)}
                            label="Written updates (for example: cannot hear announcements)"
                          />
                          <LeftCheckRow
                            checked={formData.needsLargeText}
                            onChange={(c) => setField("needsLargeText", c)}
                            label="Large text / help reading"
                          />
                          <LeftCheckRow
                            checked={formData.needsQuietSpace}
                            onChange={(c) => setField("needsQuietSpace", c)}
                            label="Quieter space"
                          />
                          <LeftCheckRow
                            checked={formData.needsBSL}
                            onChange={(c) => setField("needsBSL", c)}
                            label="Interpreter (BSL)"
                          />
                          <LeftCheckRow
                            checked={formData.needsHelpWithForms}
                            onChange={(c) => setField("needsHelpWithForms", c)}
                            label="Help completing forms"
                          />

                          <TextField
                            fullWidth
                            label="Other support (optional)"
                            placeholder="Any other support that would help today"
                            value={formData.otherSupport}
                            onChange={(e) => setField("otherSupport", e.target.value)}
                          />
                        </>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Contact method */}
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    Preferred method of contact{" "}
                    <Typography component="span" color="error">
                      *
                    </Typography>
                  </Typography>

                  <Stack direction="row" spacing={2} alignItems="flex-end">
                    <Box sx={{ flex: 1 }}>
                      <FormControl fullWidth required>
                        <InputLabel id="contact-label">Select a contact method...</InputLabel>
                        <Select
                          labelId="contact-label"
                          label="Select a contact method..."
                          value={formData.contactMethod}
                          onChange={(e) => setField("contactMethod", String(e.target.value) as ContactMethod)}
                        >
                          <MenuItem value="">Select a contact method...</MenuItem>
                          <MenuItem value="Text message">Text message</MenuItem>
                          <MenuItem value="Phone call">Phone call</MenuItem>
                          <MenuItem value="Email">Email</MenuItem>
                          <MenuItem value="Letter">Letter</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <Box
                      sx={{
                        bgcolor: "grey.100",
                        border: "1px solid",
                        borderColor: "grey.300",
                        borderRadius: 1,
                        px: 2,
                        py: 1.5,
                        maxWidth: 320,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        <InfoOutlinedIcon sx={{ fontSize: 16, mr: 1, verticalAlign: "text-bottom" }} />
                        We will use this to update you on your request
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Navigation Buttons */}
                <Box sx={{ pt: 2 }}>
                  <Divider sx={{ mb: 3 }} />

                  <Stack direction="row" spacing={2}>
                    <Button type="button" variant="outlined" color="primary" fullWidth onClick={handleSave}>
                      Save and continue later
                    </Button>

                    <Button type="submit" variant="contained" color="primary" fullWidth disabled={!canGoNext}>
                      Submit request
                    </Button>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                    <Button type="button" onClick={() => nav("/form/step-1")} sx={{ textTransform: "none" }}>
                      {"<-"} Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={() => nav("/form/step-3")}
                      disabled={!canGoNext}
                      sx={{ textTransform: "none" }}
                    >
                      Next {"->"}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
}
