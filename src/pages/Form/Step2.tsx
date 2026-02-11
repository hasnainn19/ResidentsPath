import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  Checkbox,
} from "@mui/material";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MicIcon from "@mui/icons-material/Mic";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type Urgency = "yes" | "no" | "unsure";

type Language = "en" | "cy" | "pl" | "ur";

type Service =
  | ""
  | "Housing"
  | "Social Care"
  | "Benefits"
  | "Council Tax"
  | "Other";

type HousingType =
  | ""
  | "Homelessness support"
  | "Housing repairs"
  | "Housing application"
  | "Rent arrears"
  | "Other housing issue";

type Proceed =
  | ""
  | "Join digital queue"
  | "Schedule appointment"
  | "Request callback";

type ContactMethod = "" | "Text message" | "Phone call" | "Email" | "Letter";

type Count = "0" | "1" | "2" | "3" | "4" | "5" | "6+";

type AgeBand =
  | ""
  | "Under 18"
  | "18-24"
  | "25-34"
  | "35-44"
  | "45-54"
  | "55-64"
  | "65-74"
  | "75+"
  | "Prefer not to say";

type HouseholdSize =
  | ""
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6+"
  | "Prefer not to say";

type DisabilityType =
  | ""
  | "Mobility impairment"
  | "Visual impairment"
  | "Hearing impairment"
  | "Cognitive / learning"
  | "Mental health"
  | "Other"
  | "Prefer not to say";

type SafeToContact = "yes" | "no" | "prefer_not_to_say";

type FormData = {
  language: Language;

  service: Service;
  housingType: HousingType;

  hasChildren: boolean;
  childrenCount: Count;

  hasDisabilityOrSensory: boolean;
  disabilityType: DisabilityType;

  ageBand: AgeBand;
  householdSize: HouseholdSize;

  domesticAbuseRelated: boolean;
  safeToContact: SafeToContact;
  safeContactNotes: string;

  urgent: Urgency;
  additionalInfo: string;

  proceed: Proceed;

  needsAccessibility: boolean;
  needsLanguage: boolean;

  contactMethod: ContactMethod;
};

export default function Step2() {
  const nav = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    language: "en",

    service: "",
    housingType: "",

    hasChildren: false,
    childrenCount: "0",

    hasDisabilityOrSensory: false,
    disabilityType: "",

    ageBand: "",
    householdSize: "",

    domesticAbuseRelated: false,
    safeToContact: "prefer_not_to_say",
    safeContactNotes: "",

    urgent: "unsure",
    additionalInfo: "",

    proceed: "",
    needsAccessibility: false,
    needsLanguage: false,

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
    alert("Submitted (mock)");
  };

  const isHousing = formData.service === "Housing";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Paper
          variant="outlined"
          sx={{
            p: 6,
            borderWidth: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          {/* Listen to instructions */}
          <Stack direction="row" sx={{ mb: 2 }}>
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
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Council Service Request
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please complete this form to help us assist you today
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="lang-label">Language</InputLabel>
              <Select
                labelId="lang-label"
                label="Language"
                value={formData.language}
                onChange={(e) =>
                  setField("language", e.target.value as Language)
                }
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="cy">Cymraeg</MenuItem>
                <MenuItem value="pl">Polski</MenuItem>
                <MenuItem value="ur">اردو</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Progress indicator */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" fontWeight={700}>
                Step 2 of 3: Service Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                66% Complete
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
                // TODO(BACKEND)
                submitToBackend();
              }}
            >
              <Stack spacing={4}>
                {/* Service */}
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    What service do you need?{" "}
                    <Typography component="span" color="error">
                      *
                    </Typography>
                  </Typography>

                  <FormControl fullWidth required>
                    <InputLabel id="service-label">Select a service...</InputLabel>
                    <Select
                      labelId="service-label"
                      label="Select a service..."
                      value={formData.service}
                      onChange={(e) => {
                        const next = e.target.value as Service;

                        setFormData((prev) => ({
                          ...prev,
                          service: next,
                          housingType: next === "Housing" ? prev.housingType : "",
                          hasChildren: next === "Housing" ? prev.hasChildren : false,
                          childrenCount: next === "Housing" ? prev.childrenCount : "0",
                          hasDisabilityOrSensory: next === "Housing" ? prev.hasDisabilityOrSensory : false,
                          disabilityType: next === "Housing" ? prev.disabilityType : "",
                        }));
                      }}
                    >
                      <MenuItem value="">Select a service...</MenuItem>
                      <MenuItem value="Housing">Housing</MenuItem>
                      <MenuItem value="Social Care">Social Care</MenuItem>
                      <MenuItem value="Benefits">Benefits</MenuItem>
                      <MenuItem value="Council Tax">Council Tax</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {/* Further information */}
                {isHousing && (
                  <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography fontWeight={700} sx={{ mb: 1 }}>
                          Please select the type of Housing issue{" "}
                          <Typography component="span" color="error">
                            *
                          </Typography>
                        </Typography>

                        <FormControl fullWidth required>
                          <InputLabel id="housing-type-label">Select housing issue...</InputLabel>
                          <Select
                            labelId="housing-type-label"
                            label="Select housing issue..."
                            value={formData.housingType}
                            onChange={(e) => setField("housingType", e.target.value as HousingType)}
                          >
                            <MenuItem value="">Select housing issue...</MenuItem>
                            <MenuItem value="Homelessness support">Homelessness support</MenuItem>
                            <MenuItem value="Housing repairs">Housing repairs</MenuItem>
                            <MenuItem value="Housing application">Housing application</MenuItem>
                            <MenuItem value="Rent arrears">Rent arrears</MenuItem>
                            <MenuItem value="Other housing issue">Other housing issue</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Stack>
                  </Box>
                )}
                {formData.service !== "" && (
                  <>
                    {/* Children */}
                    <Box>
                      <Stack direction="row" spacing={2} alignItems="flex-end">
                        <Box sx={{ flex: 1 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={formData.hasChildren}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFormData((prev) => ({
                                    ...prev,
                                    hasChildren: checked,
                                    childrenCount: checked ? prev.childrenCount : "0",
                                  }));
                                }}
                              />
                            }
                            label="I have dependent children"
                          />

                          {formData.hasChildren && (
                            <FormControl fullWidth>
                              <InputLabel id="children-count-label">How many children?</InputLabel>
                              <Select
                                labelId="children-count-label"
                                label="How many children?"
                                value={formData.childrenCount}
                                onChange={(e) =>
                                  setField("childrenCount", e.target.value as Count)
                                }
                              >
                                <MenuItem value="0">0</MenuItem>
                                <MenuItem value="1">1</MenuItem>
                                <MenuItem value="2">2</MenuItem>
                                <MenuItem value="3">3</MenuItem>
                                <MenuItem value="4">4</MenuItem>
                                <MenuItem value="5">5</MenuItem>
                                <MenuItem value="6+">6+</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        </Box>
                      </Stack>
                    </Box>

                    {/* Disability */}
                    <Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.hasDisabilityOrSensory}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData((prev) => ({
                                ...prev,
                                hasDisabilityOrSensory: checked,
                                disabilityType: checked ? prev.disabilityType : "",
                              }));
                            }}
                          />
                        }
                        label="I have a disability or sensory impairment"
                      />

                      {formData.hasDisabilityOrSensory && (
                        <FormControl fullWidth>
                          <InputLabel id="disability-type-label">Select a type...</InputLabel>
                          <Select
                            labelId="disability-type-label"
                            label="Select a type..."
                            value={formData.disabilityType}
                            onChange={(e) =>
                              setField("disabilityType", e.target.value as DisabilityType)
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
                      )}
                    </Box>

                    <Box sx={{ borderLeft: "4px solid", borderColor: "primary.main", pl: 3 }}>
                      <Stack spacing={3}>

                        <Stack direction="row" spacing={2}>
                          <FormControl fullWidth>
                            <InputLabel id="age-label">Age range</InputLabel>
                            <Select
                              labelId="age-label"
                              label="Age range"
                              value={formData.ageBand}
                              onChange={(e) =>
                                setField("ageBand", e.target.value as AgeBand)
                              }
                            >
                              <MenuItem value="">Select...</MenuItem>
                              <MenuItem value="Under 18">Under 18</MenuItem>
                              <MenuItem value="18-24">18-24</MenuItem>
                              <MenuItem value="25-34">25-34</MenuItem>
                              <MenuItem value="35-44">35-44</MenuItem>
                              <MenuItem value="45-54">45-54</MenuItem>
                              <MenuItem value="55-64">55-64</MenuItem>
                              <MenuItem value="65-74">65-74</MenuItem>
                              <MenuItem value="75+">75+</MenuItem>
                              <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                            </Select>
                          </FormControl>

                          <FormControl fullWidth>
                            <InputLabel id="household-label">Household size</InputLabel>
                            <Select
                              labelId="household-label"
                              label="Household size"
                              value={formData.householdSize}
                              onChange={(e) =>
                                setField("householdSize", e.target.value as HouseholdSize)
                              }
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
                          </FormControl>
                        </Stack>

                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.domesticAbuseRelated}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData((prev) => ({
                                  ...prev,
                                  domesticAbuseRelated: checked,
                                  safeToContact: checked ? prev.safeToContact : "prefer_not_to_say",
                                  safeContactNotes: checked ? prev.safeContactNotes : "",
                                }));
                              }}
                            />
                          }
                          label="This request relates to domestic abuse, or I may be at risk"
                        />

                        {formData.domesticAbuseRelated && (
                          <Box sx={{ bgcolor: "primary.light", p: 2, borderRadius: 1 }}>
                            <Stack spacing={2}>
                              <FormControl fullWidth>
                                <InputLabel id="safe-contact-label">Safe to contact?</InputLabel>
                                <Select
                                  labelId="safe-contact-label"
                                  label="Safe to contact?"
                                  value={formData.safeToContact}
                                  onChange={(e) =>
                                    setField("safeToContact", e.target.value as SafeToContact)
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
                                  label="Safe contact notes"
                                  placeholder="Safe time or method, or do not contact"
                                  value={formData.safeContactNotes}
                                  onChange={(e) =>
                                    setField("safeContactNotes", e.target.value)
                                  }
                                />
                              )}
                            </Stack>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </>
                )}
                {/* Urgency */}
                <Box>
                  <Typography fontWeight={700} sx={{ mb: 1 }}>
                    Is this issue urgent?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Urgent issues may include immediate safety or homelessness risk
                  </Typography>

                  <Stack spacing={1}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={formData.urgent === "yes"}
                            onChange={() => setField("urgent", "yes")}
                          />
                        }
                        label="Yes"
                      />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={formData.urgent === "no"}
                            onChange={() => setField("urgent", "no")}
                          />
                        }
                        label="No"
                      />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={formData.urgent === "unsure"}
                            onChange={() => setField("urgent", "unsure")}
                          />
                        }
                        label="Unsure"
                      />
                    </Paper>
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
