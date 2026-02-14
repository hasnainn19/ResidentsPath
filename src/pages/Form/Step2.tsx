import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import MicIcon from "@mui/icons-material/Mic";

import StepShell from "./components/StepShell";
import LeftCheckRow from "./components/LeftCheckRow";
import { useFormWizard } from "./context/FormWizardProvider";
import { LANGUAGE_OPTIONS } from "./data/languages";

import { GENERAL_SERVICES_CHOICE_OPTIONS, GENERAL_SERVICES_DIRECT_ITEMS, TOP_LEVEL } from "./data/enquiries";

import { ALL_SUPPORT_RESET, DISABILITY_SUPPORT_RESET, computeCanGoNext, resetFormInfo } from "./model/step2Logic";

import type {
  Count,
  Department,
  DisabilityType,
  FormData,
  HouseholdSize,
  Proceed,
  SafeToContact,
  Urgency,
} from "./model/types";
import StepActions from "./components/StepActions";
import { useMemo } from "react";
import { getEnquiryContext } from "./model/enquiriesContext";

export default function Step2() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave, handleListenAll } = useFormWizard();

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // TODO(BACKEND): Replace with Speech-to-Text
  const handleVoiceInput = () => alert("Voice input started (mock)");

  const enquiryContex = useMemo(
    () => getEnquiryContext(formData),
    [formData.topLevel, formData.generalServicesChoice, formData.enquiryId, formData.specificDetailId],
  );

  const isGeneralServices = enquiryContex.isGeneralServices;
  const generalServicesIsSection = enquiryContex.generalServicesIsSection;

  const enquiryOptions = enquiryContex.enquiryOptions;

  const specificOptions = enquiryContex.specificOptions;
  const showSpecificDropdown = enquiryContex.showSpecificDropdown;

  const hasChosenEnquiry = enquiryContex.hasChosenEnquiry;
  const hasEnoughToProceed = enquiryContex.hasEnoughToProceed;

  const showChildrenQs = enquiryContex.showChildrenQs;
  const showDisabilityQs = enquiryContex.showDisabilityQs;
  const showHouseholdSize = enquiryContex.showHouseholdSize;
  const showDomesticAbuseQs = enquiryContex.showDomesticAbuseQs;

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
    <StepShell
      step={2}
      totalSteps={3}
      title="Council service request"
      subtitle="Please complete this form to help us support you today"
      onBack={() => nav("/form/step-1")}
      onListenAll={handleListenAll}
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
            nav("/form/step-3");
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
            {/* Navigation Buttons */}
            <StepActions
              onSave={handleSave}
              advanceLabel="Continue"
              advanceDisabled={!canGoNext}
              showPrevious
              onPrevious={() => nav("/form/step-1")}
            />
          </Stack>
        </Box>
      </Paper>
    </StepShell>
  );
}
