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
 * The step also asks what should happen next (queue or appointment).
 * The Continue button is enabled only when the required choices for the
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

import FormStepLayout from "../../components/FormPageComponents/FormStepLayout";
import WithTTS from "../../components/FormPageComponents/WithTTS";
import LeftCheckRow from "../../components/FormPageComponents/LeftCheckRow";
import { useFormWizard } from "../../context/FormWizardProvider";
import { LANGUAGE_OPTIONS } from "./data/languages";

import { TOP_LEVEL } from "./data/enquiries";

import {
  computeCanGoNext,
  applyTopLevelChange,
  applyEnquiryChange,
  applyUrgencyChange,
  applyProceedChange,
  shouldShowSupportNotes,
} from "./model/enquirySelectionLogic";

import type {
  Count,
  DisabilityType,
  FormData,
  HouseholdSize,
  Proceed,
  SafeToContact,
  Urgency,
  AgeRange,
} from "./model/formFieldTypes";
import StepActions from "../../components/FormPageComponents/StepActions";
import { getEnquirySelectionState } from "./model/getEnquirySelectionState";
import { FIELD_META } from "./model/fieldMeta";
import { UI_OPTIONS } from "../../../shared/formSchema";

export default function EnquirySelection() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave } = useFormWizard();

  const labelOptional = (key: keyof FormData) => FIELD_META[key].label + " (optional)";

  const countChars = (key: keyof FormData, value: string, extra?: string) => {
    const max = FIELD_META[key].maxLen ?? 0;
    if (!max) return extra;
    const count = value.length;

    if (extra) return `${count}/${max} characters. ${extra}`;
    return `${count}/${max} characters.`;
  };

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // TODO: Replace with Speech-to-Text
  const handleVoiceInput = () => alert("Voice input started (mock)");

  // Logic for which follow-up questions to show.
  const enquirySelectionState = useMemo(() => getEnquirySelectionState(formData), [formData]);

  const {
    isOther,
    enquiryOptions,
    specificOptions,
    showSpecificDropdown,
    hasChosenEnquiry,
    hasEnoughToProceed,
    showChildrenQs,
    showDisabilityQs,
    showHouseholdSize,
    showDomesticAbuseQs,
    showAgeRange,
  } = enquirySelectionState;

  const needsUrgentReason = formData.urgent === "yes";

  // Whether the continue button should be enabled, based on whether required fields are filled in
  const canGoNext = computeCanGoNext(formData, hasEnoughToProceed, needsUrgentReason);

  const showEnquiryDropdown = formData.topLevel !== "" && !isOther && enquiryOptions.length > 1;

  function handleTopLevelChange(nextTopLevel: string) {
    setFormData((prev) => applyTopLevelChange(prev, nextTopLevel));
  }

  function handleEnquiryChange(nextId: string) {
    setFormData((prev) => applyEnquiryChange(prev, nextId, enquiryOptions));
  }

  function setUrgency(value: Urgency) {
    setFormData((prev) => applyUrgencyChange(prev, value));
  }

  function handleProceedChange(next: Proceed) {
    setFormData((prev) => applyProceedChange(prev, next));
  }

  // Keep the support section short unless "Show more" is opened
  const [showMoreSupport, setShowMoreSupport] = useState(false);

  const showSupportNotes = shouldShowSupportNotes(formData);

  // Build TTS strings for each section based on what is currently shown
  function buildServiceTts() {
    const parts: string[] = [];
    parts.push("What do you need help with? Select an area.");

    if (!formData.topLevel) return parts.join(" ");

    if (isOther) {
      parts.push("Then describe your enquiry.");
      return parts.join(" ");
    }

    if (showEnquiryDropdown) {
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

  const urgencyTts =
    "Do you need support sooner today? Choose yes, no, or not sure. For example: a safety concern, nowhere safe to stay tonight, health or mobility needs, or something time-limited today. If you choose yes, select a reason.";

  const proceedTts =
    "How would you like to proceed? Select join the digital queue or book an appointment.";

  const additionalInfoTts =
    "Anything else you want to tell us. This is optional. Add any details that might help. You can also use voice input.";

  const supportTts =
    "Support needs are optional. Select any support you need today, such as accessibility support or language support. You can also show more support options, and add support notes.";

  const insetSectionSx = {
    borderLeft: "4px solid",
    borderColor: "primary.main",
    pl: { xs: 2, sm: 3 },
    py: { xs: 0.25, sm: 0 },
  } as const;

  
  return (
    <FormStepLayout
      step={1}
      totalSteps={4}
      title="Council service request"
      subtitle="Please complete this form to help us support you today"
      languageValue={formData.language}
      onLanguageChange={(code) => setField("language", code)}
      languageOptions={LANGUAGE_OPTIONS}
    >
      {/* Main form card */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: { xs: 1.5, sm: 2 },
        }}
      >
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canGoNext) return;
            nav("/form/personal-details");
          }}
        >
          <Stack spacing={{ xs: 3, sm: 4 }}>
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

            {showEnquiryDropdown && (
              <WithTTS
                copy={{
                  label: FIELD_META.enquiryId.label,
                  tts: "Choose an enquiry. This tells us what you need help with.",
                }}
                required
                sx={insetSectionSx}
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
            )}

            {isOther && formData.topLevel !== "" && (
              <WithTTS
                copy={{
                  label: FIELD_META.otherEnquiryText.label,
                  tts: "Describe your enquiry. Briefly tell us what you need help with.",
                }}
                required
                sx={insetSectionSx}
              >
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={3}
                  label={FIELD_META.otherEnquiryText.label}
                  placeholder="Tell us what you need help with"
                  value={formData.otherEnquiryText}
                  onChange={(e) => setField("otherEnquiryText", e.target.value)}
                  helperText={countChars(
                    "otherEnquiryText",
                    formData.otherEnquiryText,
                    "Avoid sharing bank details or passwords.",
                  )}
                  slotProps={{ htmlInput: { maxLength: FIELD_META.otherEnquiryText.maxLen } }}
                />
              </WithTTS>
            )}

            {
              // Show the "more detail" dropdown when relevant
              hasChosenEnquiry && showSpecificDropdown && (
                <WithTTS
                  copy={{
                    label: FIELD_META.specificDetailId.label,
                    tts: "More detail. Choose the option that best matches your situation.",
                  }}
                  required
                  sx={insetSectionSx}
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
                (showChildrenQs ||
                  showDisabilityQs ||
                  showHouseholdSize ||
                  showDomesticAbuseQs ||
                  showAgeRange) && (
                  <WithTTS
                    copy={{
                      label: "Additional questions (optional)",
                      tts: buildAdditionalQuestionsTts(),
                    }}
                    titleVariant="subtitle2"
                  >
                    <Stack spacing={{ xs: 2.25, sm: 3 }}>
                      {/* Children */}
                      {showChildrenQs && (
                        <Box sx={insetSectionSx}>
                          <LeftCheckRow
                            checked={formData.hasChildren}
                            onChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                hasChildren: checked,
                                childrenCount: "",
                              }))
                            }
                            label={FIELD_META.hasChildren.label}
                          >
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              (Children who usually live with you and are financially dependent on
                              you.)
                            </Typography>

                            {formData.hasChildren && (
                              <Box sx={{ mt: 1 }}>
                                <FormControl fullWidth>
                                  <InputLabel id="children-count-label">
                                    {FIELD_META.childrenCount.label}
                                  </InputLabel>
                                  <Select
                                    labelId="children-count-label"
                                    label={FIELD_META.childrenCount.label}
                                    value={formData.childrenCount}
                                    onChange={(e) =>
                                      setField("childrenCount", String(e.target.value) as Count)
                                    }
                                  >
                                    <MenuItem value="">Select...</MenuItem>
                                    {UI_OPTIONS.childrenCount.map((opt) => (
                                      <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>
                            )}
                          </LeftCheckRow>
                        </Box>
                      )}

                      {/* Disability */}
                      {showDisabilityQs && (
                        <Box sx={insetSectionSx}>
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
                                    },
                              )
                            }
                            label={FIELD_META.hasDisabilityOrSensory.label}
                          >
                            {formData.hasDisabilityOrSensory && (
                              <Box sx={{ mt: 1 }}>
                                <FormControl fullWidth>
                                  <InputLabel id="disability-type-label">
                                    {FIELD_META.disabilityType.label}
                                  </InputLabel>
                                  <Select
                                    labelId="disability-type-label"
                                    label={FIELD_META.disabilityType.label}
                                    value={formData.disabilityType}
                                    onChange={(e) =>
                                      setField(
                                        "disabilityType",
                                        String(e.target.value) as DisabilityType,
                                      )
                                    }
                                  >
                                    <MenuItem value="">Select...</MenuItem>
                                    {UI_OPTIONS.disabilityType.map((opt) => (
                                      <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Box>
                            )}
                          </LeftCheckRow>
                        </Box>
                      )}

                      {showHouseholdSize && (
                        <Box sx={insetSectionSx}>
                          <FormControl fullWidth>
                            <InputLabel id="household-label">
                              {FIELD_META.householdSize.label}
                            </InputLabel>
                            <Select
                              labelId="household-label"
                              label={FIELD_META.householdSize.label}
                              value={formData.householdSize}
                              onChange={(e) =>
                                setField("householdSize", String(e.target.value) as HouseholdSize)
                              }
                            >
                              <MenuItem value="">Select...</MenuItem>
                              {UI_OPTIONS.householdSize.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              People who usually live with you (including you).
                            </Typography>
                          </FormControl>
                        </Box>
                      )}

                      {
                        // If DOB was not provided in Step 2, offer an optional age range after the enquiry is chosen
                        showAgeRange && (
                          <Box sx={insetSectionSx}>
                            <FormControl fullWidth>
                              <InputLabel id="age-range-label">Select an age range...</InputLabel>
                              <Select
                                labelId="age-range-label"
                                label="Select an age range..."
                                value={formData.ageRange}
                                onChange={(e) =>
                                  setField("ageRange", String(e.target.value) as AgeRange)
                                }
                              >
                                <MenuItem value="">Select...</MenuItem>
                                {UI_OPTIONS.ageRange.map((opt) => (
                                  <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        )
                      }

                      {showDomesticAbuseQs && (
                        <Box sx={insetSectionSx}>
                          <LeftCheckRow
                            checked={formData.domesticAbuse}
                            onChange={(checked) =>
                              setFormData((prev) =>
                                checked
                                  ? { ...prev, domesticAbuse: true }
                                  : {
                                      ...prev,
                                      domesticAbuse: false,
                                      safeToContact: "PREFER_NOT_TO_SAY",
                                      safeContactNotes: "",
                                    },
                              )
                            }
                            label={FIELD_META.domesticAbuse.label}
                          >
                            {formData.domesticAbuse && (
                              <Box sx={{ mt: 1.5 }}>
                                <Stack spacing={2}>
                                  <FormControl fullWidth>
                                    <InputLabel id="safe-contact-label">
                                      {FIELD_META.safeToContact.label}
                                    </InputLabel>
                                    <Select
                                      labelId="safe-contact-label"
                                      label={FIELD_META.safeToContact.label}
                                      value={formData.safeToContact}
                                      onChange={(e) =>
                                        setField(
                                          "safeToContact",
                                          String(e.target.value) as SafeToContact,
                                        )
                                      }
                                    >
                                      {UI_OPTIONS.safeToContact.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>

                                  {formData.safeToContact === "no" && (
                                    <TextField
                                      fullWidth
                                      multiline
                                      label={labelOptional("safeContactNotes")}
                                      placeholder="Safe time or method, or do not contact"
                                      value={formData.safeContactNotes}
                                      onChange={(e) => setField("safeContactNotes", e.target.value)}
                                      helperText={countChars(
                                        "safeContactNotes",
                                        formData.safeContactNotes,
                                      )}
                                      slotProps={{
                                        htmlInput: {
                                          maxLength: FIELD_META.safeContactNotes.maxLen,
                                        },
                                      }}
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
              copy={{ label: FIELD_META.urgent.label, tts: urgencyTts }}
              titleVariant="subtitle1"
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                For example: a safety concern, nowhere safe to stay tonight, health or mobility
                needs, or something time-limited today.
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
                          px: { xs: 1.5, sm: 2 },
                          py: { xs: 1, sm: 1.25 },
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: checked ? "primary.main" : "divider",
                          bgcolor: checked ? "action.selected" : "background.paper",
                          cursor: "pointer",
                          transition:
                            "background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease",
                          "&:hover": {
                            bgcolor: checked ? "action.selected" : "action.hover",
                          },
                          "&:focus-within": {
                            boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
                          },
                          "& .MuiFormControlLabel-label": {
                            fontSize: { xs: 15, sm: 16 },
                            lineHeight: 1.3,
                          },
                        }}
                      />
                    );
                  })}
                </RadioGroup>
              </FormControl>

              {needsUrgentReason && (
                <Box sx={{ ...insetSectionSx, mt: 2 }}>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    {FIELD_META.urgentReason.label}{" "}
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
                      onChange={(e) => {
                        const v = String(
                          (e.target as HTMLInputElement).value,
                        ) as FormData["urgentReason"];
                        setFormData((prev) => ({
                          ...prev,
                          urgentReason: v,
                          urgentReasonOtherText: v === "OTHER" ? prev.urgentReasonOtherText : "",
                        }));
                      }}
                    >
                      <MenuItem value="">Select a reason...</MenuItem>
                      {UI_OPTIONS.urgentReason.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {formData.urgentReason === "OTHER" && (
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <Typography component="label" htmlFor="urgent-reason-other" fontWeight={700}>
                      Briefly describe why you need support sooner today
                    </Typography>

                    <TextField
                      id="urgent-reason-other"
                      fullWidth
                      required
                      multiline
                      minRows={3}
                      placeholder="Tell us why this is urgent"
                      value={formData.urgentReasonOtherText}
                      onChange={(e) => setField("urgentReasonOtherText", e.target.value)}
                      slotProps={{
                        htmlInput: { maxLength: FIELD_META.urgentReasonOtherText.maxLen },
                      }}
                      helperText={countChars("urgentReasonOtherText", formData.urgentReasonOtherText)}
                    />
                  </Stack>
                )}
                </Box>
              )}
            </WithTTS>

            {/* Additional info */}
            <WithTTS
              copy={{ label: labelOptional("additionalInfo"), tts: additionalInfoTts }}
              titleVariant="subtitle1"
            >
              <TextField
                fullWidth
                multiline
                minRows={4}
                placeholder="Add any details that might help us support you..."
                value={formData.additionalInfo}
                onChange={(e) => setField("additionalInfo", e.target.value)}
                helperText={countChars("additionalInfo", formData.additionalInfo)}
                slotProps={{ htmlInput: { maxLength: FIELD_META.additionalInfo.maxLen } }}
              />

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 0.5 }}
              >
                <MicIcon fontSize="small" />
                <Button
                  type="button"
                  size="small"
                  onClick={handleVoiceInput}
                  sx={{ textTransform: "none" }}
                >
                  Voice input
                </Button>
              </Stack>
            </WithTTS>

            {/* Proceed */}
            <Box sx={{ pt: 2 }}>
              <Divider sx={{ mb: 3 }} />

              <WithTTS
                copy={{ label: FIELD_META.proceed.label, tts: proceedTts }}
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
                    {UI_OPTIONS.proceed.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </WithTTS>
            </Box>

            {/* Support options */}
            <WithTTS
              copy={{ label: "Support needs (optional)", tts: supportTts }}
              sx={insetSectionSx}
              titleVariant="subtitle1"
            >
              <Stack spacing={1.25}>
                <LeftCheckRow
                  checked={formData.needsAccessibility}
                  onChange={(checked) => setField("needsAccessibility", checked)}
                  label={FIELD_META.needsAccessibility.label}
                />
                <LeftCheckRow
                  checked={formData.needsLanguage}
                  onChange={(checked) => setField("needsLanguage", checked)}
                  label={FIELD_META.needsLanguage.label}
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
                      label={FIELD_META.needsSeating.label}
                    />
                    <LeftCheckRow
                      checked={formData.needsWrittenUpdates}
                      onChange={(c) => setField("needsWrittenUpdates", c)}
                      label={FIELD_META.needsWrittenUpdates.label}
                    />
                    <LeftCheckRow
                      checked={formData.needsLargeText}
                      onChange={(c) => setField("needsLargeText", c)}
                      label={FIELD_META.needsLargeText.label}
                    />
                    <LeftCheckRow
                      checked={formData.needsQuietSpace}
                      onChange={(c) => setField("needsQuietSpace", c)}
                      label={FIELD_META.needsQuietSpace.label}
                    />
                    <LeftCheckRow
                      checked={formData.needsBSL}
                      onChange={(c) => setField("needsBSL", c)}
                      label={FIELD_META.needsBSL.label}
                    />
                    <LeftCheckRow
                      checked={formData.needsHelpWithForms}
                      onChange={(c) => setField("needsHelpWithForms", c)}
                      label={FIELD_META.needsHelpWithForms.label}
                    />

                    <TextField
                      fullWidth
                      label={labelOptional("otherSupport")}
                      placeholder="Any other support that would help today"
                      value={formData.otherSupport}
                      onChange={(e) => setField("otherSupport", e.target.value)}
                      helperText={countChars("otherSupport", formData.otherSupport)}
                      slotProps={{ htmlInput: { maxLength: FIELD_META.otherSupport.maxLen } }}
                    />
                  </Stack>
                </Collapse>

                {showSupportNotes && (
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label={labelOptional("supportNotes")}
                    placeholder="Anything staff should know to support you today"
                    value={formData.supportNotes}
                    onChange={(e) => setField("supportNotes", e.target.value)}
                    helperText={countChars("supportNotes", formData.supportNotes)}
                    slotProps={{ htmlInput: { maxLength: FIELD_META.supportNotes.maxLen } }}
                  />
                )}
              </Stack>
            </WithTTS>

            {/* Navigation Buttons */}
            <StepActions
              onSave={handleSave}
              advanceLabel="Continue"
              advanceDisabled={!canGoNext}
            />
          </Stack>
        </Box>
      </Paper>
    </FormStepLayout>
  );
}