/**
 * Enquiry selection: select the service request and answer any relevant follow-up questions.
 *
 * Collects:
 * - Top-level service area
 * - General Services topic when relevant
 * - The specific enquiry (and "more detail" choice when required)
 *
 * Depending on the enquiry, extra questions may appear (eg dependent children, disability/sensory
 * needs, household size, domestic abuse prompts). These appear only when relevant to what was chosen.
 *
 * The step also asks what should happen next (queue, appointment, callback). Support needs are shown
 * only for queue/appointment. The Continue button is enabled only when the required choices for the
 * current path have been completed.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import MicIcon from "@mui/icons-material/Mic";

import StepShell from "./components/StepShell";
import WithTTS from "./components/WithTTS";
import LeftCheckRow from "./components/LeftCheckRow";
import { useFormWizard } from "./context/FormWizardProvider";
import { LANGUAGE_OPTIONS } from "./data/languages";

import { GENERAL_SERVICES_CHOICE_OPTIONS, GENERAL_SERVICES_DIRECT_ITEMS, TOP_LEVEL } from "./data/enquiries";

import { DISABILITY_SUPPORT_RESET, computeCanGoNext, resetFormInfo } from "./model/enquirySelectionLogic";

import type {
  Count,
  Department,
  DisabilityType,
  FormData,
  HouseholdSize,
  Proceed,
  SafeToContact,
  Urgency,
  AgeRange,
} from "./model/types";
import StepActions from "./components/StepActions";
import { getEnquiryContext } from "./model/enquiriesContext";

export default function EnquirySelection() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave } = useFormWizard();

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // TODO: Replace with Speech-to-Text
  const handleVoiceInput = () => alert("Voice input started (mock)");

  // Logic for which follow-up questions to show.
  const enquiryContex = useMemo(
    () => getEnquiryContext(formData),
    [
      formData.topLevel,
      formData.generalServicesChoice,
      formData.enquiryId,
      formData.specificDetailId,
      formData.otherEnquiryText,
    ],
  );

  const isGeneralServices = enquiryContex.isGeneralServices;
  const generalServicesIsSection = enquiryContex.generalServicesIsSection;
  const isOther = enquiryContex.isOther;

  const enquiryOptions = enquiryContex.enquiryOptions;

  const specificOptions = enquiryContex.specificOptions;
  const showSpecificDropdown = enquiryContex.showSpecificDropdown;

  const hasChosenEnquiry = enquiryContex.hasChosenEnquiry;
  const hasEnoughToProceed = enquiryContex.hasEnoughToProceed;

  const showChildrenQs = enquiryContex.showChildrenQs;
  const showDisabilityQs = enquiryContex.showDisabilityQs;
  const showHouseholdSize = enquiryContex.showHouseholdSize;
  const showDomesticAbuseQs = enquiryContex.showDomesticAbuseQs;
  const showAgeRange = enquiryContex.showAgeRange;

  const needsUrgentReason = formData.urgent === "yes";

  // Whether the continue button should be enabled, based on whether required fields are filled in
  const canGoNext = computeCanGoNext(formData, hasEnoughToProceed, needsUrgentReason);

  // Changing the top level area invalidates any lower down enquiry selections, so reset them
  function handleTopLevelChange(nextTopLevel: string) {
    setFormData((prev) => {
      const next = resetFormInfo({
        ...prev,
        topLevel: nextTopLevel,
        generalServicesChoice: "",
      });
      if (nextTopLevel === "Other") {
        return { ...next, routedDepartment: "General customer services" };
      }
      return next;
    });
  }

  // Handle changes to the General Services choice, which can affect which enquiries are shown
  function handleGeneralServicesChoiceChange(nextChoice: string) {
    setFormData((prev): FormData => {
      const nextState = resetFormInfo({ ...prev, generalServicesChoice: nextChoice });

      // "direct:" options map straight to an enquiry (skip the extra enquiry dropdown)
      if (nextChoice.startsWith("direct:")) {
        const id = nextChoice.replace("direct:", "");
        const match = GENERAL_SERVICES_DIRECT_ITEMS.find((x) => x.value === id);

        return {
          ...nextState,
          enquiryId: id,
          routedDepartment: (match?.department ?? "") as "" | Department,
        };
      }
      // Section choices do not map directly to an enquiry, so just reset the enquiry fields and show the dropdown
      return nextState;
    });
  }

  // Wipe follow up answers when enquiry changes
  function handleEnquiryChange(nextId: string) {
    const match = enquiryOptions.find((x) => x.value === nextId) || null;

    setFormData((prev) => ({
      ...prev,
      enquiryId: nextId,
      specificDetailId: "",
      routedDepartment: match?.department ?? "",

      householdSize: "",
      hasChildren: false,
      childrenCount: "0",

      hasDisabilityOrSensory: false,
      disabilityType: "",

      domesticAbuse: false,
      safeToContact: "prefer_not_to_say",
      safeContactNotes: "",

      ...DISABILITY_SUPPORT_RESET,
    }));
  }

  // Clear urgent details when urgency is not "yes"
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
      return { ...prev, proceed: next };
    });
  }

  // Keep the support section short unless "Show more" is opened
  const [showMoreSupport, setShowMoreSupport] = useState(false);

  // Build TTS strings for each section based on what is currently shown
  function buildServiceTts() {
    const parts: string[] = [];
    parts.push("What do you need help with? Select an area.");

    if (!formData.topLevel) return parts.join(" ");

    if (isOther) {
      parts.push("Then describe your enquiry.");
      return parts.join(" ");
    }

    if (isGeneralServices) {
      if (!formData.generalServicesChoice) {
        parts.push("Then choose a topic.");
        return parts.join(" ");
      }
      parts.push("Then choose an enquiry.");
    } else {
      parts.push("Then choose an enquiry.");
    }

    if (hasChosenEnquiry && showSpecificDropdown) {
      parts.push("Then choose more detail.");
    }

    return parts.join(" ");
  }

  // Build the TTS string for the additional questions section based on which questions are shown
  function buildAdditionalQuestionsTts() {
    const parts: string[] = [];
    parts.push("Additional questions.");

    if (showChildrenQs) parts.push("Do you have dependent children?");
    if (showDisabilityQs) parts.push("Do you have a disability or sensory impairment?");
    if (showHouseholdSize) parts.push("How many people are in your household?");
    if (showAgeRange) parts.push("What is your age range?");
    if (showDomesticAbuseQs) parts.push("Are you a domestic abuse victim/survivor?");

    return parts.join(" ");
  }

  const urgencyTts = "Do you need support sooner today? Choose yes, no, or not sure. For example: a safety concern, nowhere safe to stay tonight, health or mobility needs, or something time-limited today. If you choose yes, select a reason. If you choose other, type a short explanation."; 

  const proceedTts =
    "How would you like to proceed? Select join the digital queue or book an appointment. We may suggest a quicker online or self-service option if available.";

  const additionalInfoTts =
    "Anything else you want to tell us. This is optional. Add any details that might help. You can also use voice input.";

  const supportTts =
    "Support needs are optional. Select any support you need today, such as accessibility support or language support. You can also show more support options.";

  return (
    <StepShell
      step={2}
      totalSteps={4}
      title="Council service request"
      subtitle="Please complete this form to help us support you today"
      onBack={() => nav("/form/personal-details")}
      languageValue={formData.language}
      onLanguageChange={(code) => setField("language", code)}
      languageOptions={LANGUAGE_OPTIONS}
    >
      {/* Main form card */}
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canGoNext) return;
            nav("/form/actions");
          }}
        >
          <Stack spacing={4}>
            {/* Service */}
            <WithTTS
              copy={{ label: "What do you need help with?", tts: buildServiceTts() }}
              required
              titleVariant="subtitle1"
            >
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
            </WithTTS>

            {/* Further information */}
            {
              // For General Services: only show enquiries after a section is chosen (unless it is a direct item)
              isGeneralServices && formData.topLevel !== "" && (
                <WithTTS
                  copy={{ label: "Choose a topic", tts: "Choose a topic. This helps narrow down your request." }}
                  required
                  sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}
                >
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
                </WithTTS>
              )
            }

            {
              // Show the enquiry dropdown when a top-level area is chosen
              formData.topLevel !== "" &&
                !isOther &&
                // For General Services, only show the enquiry dropdown after a section is chosen unless it's a direct item, which maps straight to an enquiry
                (!isGeneralServices || (formData.generalServicesChoice !== "" && generalServicesIsSection)) && (
                  <WithTTS
                    copy={{
                      label: "Choose an enquiry",
                      tts: "Choose an enquiry. This tells us what you need help with.",
                    }}
                    required
                    sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}
                  >
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
                  </WithTTS>
                )
            }
            
            {isOther && formData.topLevel !== "" && (
              <WithTTS
                copy={{
                  label: "Describe your enquiry",
                  tts: "Describe your enquiry. Briefly tell us what you need help with.",
                }}
                required
                sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}
              >
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={3}
                  label="Describe your enquiry"
                  placeholder="Tell us what you need help with"
                  value={formData.otherEnquiryText}
                  onChange={(e) => setField("otherEnquiryText", e.target.value)}
                  helperText="Avoid sharing bank details or passwords."
                />
              </WithTTS>
            )}

            {
              // Show the "more detail" dropdown when relevant
              hasChosenEnquiry && showSpecificDropdown && (
                <WithTTS
                  copy={{
                    label: "More detail",
                    tts: "More detail. Choose the option that best matches your situation.",
                  }}
                  required
                  sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}
                >
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
                </WithTTS>
              )
            }

            {
              // Show follow-up questions only when a specific enquiry has been chosen
              hasEnoughToProceed &&
                (showChildrenQs || showDisabilityQs || showHouseholdSize || showDomesticAbuseQs || showAgeRange) && (
                  <WithTTS
                    copy={{ label: "Additional questions (optional)", tts: buildAdditionalQuestionsTts() }}
                    titleVariant="subtitle2"
                  >
                    <Stack spacing={3}>
                      {/* Children */}
                      {showChildrenQs && (
                        <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                          <LeftCheckRow
                            checked={formData.hasChildren}
                            onChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                hasChildren: checked,
                                childrenCount: checked ? "1" : "0",
                              }))
                            }
                            label="I have dependent children"
                          >
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              (Children who usually live with you and are financially dependent on you.)
                            </Typography>

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
                                    onChange={(e) =>
                                      setField("disabilityType", String(e.target.value) as DisabilityType)
                                    }
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

                      {showHouseholdSize && (
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

                      {
                        // If DOB was not provided in Step 1, offer an optional age range after the enquiry is chosen
                        showAgeRange && (
                          <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                            <FormControl fullWidth>
                              <InputLabel id="age-range-label">Select an age range...</InputLabel>
                              <Select
                                labelId="age-range-label"
                                label="Select an age range..."
                                value={formData.ageRange}
                                onChange={(e) => setField("ageRange", String(e.target.value) as AgeRange)}
                              >
                                <MenuItem value="">Select...</MenuItem>
                                <MenuItem value="Under 18">Under 18</MenuItem>
                                <MenuItem value="18-24">18-24</MenuItem>
                                <MenuItem value="25-34">25-34</MenuItem>
                                <MenuItem value="35-44">35-44</MenuItem>
                                <MenuItem value="45-54">45-54</MenuItem>
                                <MenuItem value="55-64">55-64</MenuItem>
                                <MenuItem value="65+">65+</MenuItem>
                                <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        )
                      }

                      {showDomesticAbuseQs && (
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
                                      onChange={(e) =>
                                        setField("safeToContact", String(e.target.value) as SafeToContact)
                                      }
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
                    </Stack>
                  </WithTTS>
                )
            }

            {/* Urgency */}
            <WithTTS
              copy={{ label: "Do you need support sooner today?", tts: urgencyTts }}
              titleVariant="subtitle1"
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                For example: a safety concern, nowhere safe to stay tonight, health or mobility needs, or something
                time-limited today.
              </Typography>

              <FormControl component="fieldset" sx={{ width: "100%" }}>
                <RadioGroup
                  value={formData.urgent}
                  onChange={(e) => setUrgency(e.target.value as Urgency)}
                  sx={{ gap: 1 }}
                >
                  {(
                    [
                      ["yes", "Yes"],
                      ["no", "No"],
                      ["unsure", "Not sure"],
                    ] as const
                  ).map(([value, label]) => {
                    const checked = formData.urgent === value;

                    return (
                      <FormControlLabel
                        key={value}
                        value={value}
                        control={<Radio sx={{ p: 0.75 }} />}
                        label={label}
                        sx={{
                          m: 0,
                          width: "100%",
                          px: 2,
                          py: 1.25,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: checked ? "primary.main" : "divider",
                          bgcolor: checked ? "action.selected" : "background.paper",
                          cursor: "pointer",
                          transition: "background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
                          "&:hover": {
                            bgcolor: checked ? "action.selected" : "action.hover",
                          },
                          "&:focus-within": {
                            boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
                          },
                          "& .MuiFormControlLabel-label": {
                            fontSize: 16,
                            lineHeight: 1.3,
                          },
                        }}
                      />
                    );
                  })}
                </RadioGroup>
              </FormControl>

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
            </WithTTS>

            {/* Additional info */}
            <WithTTS
              copy={{ label: "Anything else you want to tell us (optional)", tts: additionalInfoTts }}
              titleVariant="subtitle1"
            >
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
            </WithTTS>

            {/* Proceed */}
            <Box sx={{ pt: 2 }}>
              <Divider sx={{ mb: 3 }} />

              <WithTTS
                copy={{ label: "How would you like to proceed?", tts: proceedTts }}
                required
                titleVariant="subtitle1"
              >
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
                  </Select>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    We may suggest a quicker online or self-service option if available.
                  </Typography>
                </FormControl>
              </WithTTS>
            </Box>

            {/* Support options */}
            <WithTTS
              copy={{ label: "Support needs (optional)", tts: supportTts }}
              sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}
              titleVariant="subtitle1"
            >
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
                <Button
                  type="button"
                  size="small"
                  onClick={() => setShowMoreSupport((s) => !s)}
                  sx={{ textTransform: "none", alignSelf: "flex-start" }}
                >
                  {showMoreSupport ? "Hide options" : "Show more support options"}
                </Button>

                <Collapse in={showMoreSupport} timeout={200} unmountOnExit>
                  <Stack spacing={1.25} sx={{ mt: 1 }}>
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
                  </Stack>
                </Collapse>
              </Stack>
            </WithTTS>

            {/* Navigation Buttons */}
            <StepActions
              onSave={handleSave}
              advanceLabel="Continue"
              advanceDisabled={!canGoNext}
              showPrevious
              onPrevious={() => nav("/form/personal-details")}
            />
          </Stack>
        </Box>
      </Paper>
    </StepShell>
  );
}
