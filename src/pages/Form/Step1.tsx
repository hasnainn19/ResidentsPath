/**
 * Step 1: optional resident details.
 *
 * Starts by asking whether the resident wants to provide personal/contact details at all.
 * If they choose not to, the related fields are cleared so they do not appear later.
 *
 * If details are provided, this step collects basic info (eg name, DOB, email/phone, preferred
 * contact method) and then moves on to Step 2 for the actual request/triage.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  Stack,
  Alert,
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Collapse,
  Divider,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";

import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";

import StepShell from "./components/StepShell";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "./context/FormWizardProvider";
import type { ContactMethod, YesNo, FormData } from "./model/types";
import StepActions from "./components/StepActions";

type PhoneType = "" | "Mobile" | "Home phone";

// Remove all non-digit characters from a string
function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function normaliseUkPostcode(postCode: string) {
  return postCode.toUpperCase().replace(/\s+/g, " ").trim();
}

function isValidUkPostcode(postCode: string) {
  const s = normaliseUkPostcode(postCode);
  if (!s) return true;

  const re = /^(GIR 0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/;
  return re.test(s);
}

export default function Step1() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave } = useFormWizard();

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  const provideDetails: YesNo = formData.provideDetails ?? "yes";
  // Store DOB as an ISO string in state. Convert to Dayjs only for the DatePicker
  const dobValue = formData.dob ? dayjs(formData.dob) : null;

  // If the user opts out, clear personal/contact fields to avoid carrying data forward
  function handleProvideDetailsChange(v: YesNo) {
    setFormData((prev) => {
      const next: FormData = { ...prev, provideDetails: v };

      if (v === "no") {
        return {
          ...next,
          firstName: "",
          lastName: "",
          dob: null,
          email: "",
          phone: "",
          phoneCountry: "GB",
          phoneType: "" as PhoneType,
          contactMethod: "" as "" | ContactMethod,
          addressLine1: "",
          addressLine2: "",
          addressLine3: "",
          townOrCity: "",
          postcode: "",
        };
      }

      return next;
    });
  }

  // Build country + dial-code options and put GB first
  function buildDialOptions() {
    const regionNames = new Intl.DisplayNames(["en-GB"], { type: "region" });

    const options = getCountries().map((cc) => {
      const dial = "+" + getCountryCallingCode(cc);
      const name = regionNames.of(cc) || cc;
      return { country: cc, dialCode: dial, label: name + " (" + dial + ")" };
    });

    options.sort((a, b) => {
      if (a.country === "GB") return -1;
      if (b.country === "GB") return 1;
      return a.label.localeCompare(b.label);
    });

    return options;
  }

  const dialOptions = buildDialOptions();

  const phoneCountry = (formData.phoneCountry || "GB") as CountryCode;
  const dialCode = "+" + getCountryCallingCode(phoneCountry);

  // UI edits the national part, state stores the full number with dial code
  const nationalDigits =
    formData.phone && formData.phone.startsWith(dialCode) ? digitsOnly(formData.phone.slice(dialCode.length)) : "";

  // Soft length cap to prevent very long inputs. Not full phone validation yet
  const maxNationalLen = phoneCountry === "GB" ? 10 : 15;

  // Preserve the phone digits when changing country, then rebuild the stored value with the new dial code
  function handleCountryChange(nextCountry: CountryCode) {
    const nextDial = "+" + getCountryCallingCode(nextCountry);

    const currentNational = nationalDigits;
    const nextPhone = currentNational ? nextDial + currentNational : "";

    setFormData((prev) => ({
      ...prev,
      phoneCountry: nextCountry,
      phone: nextPhone,
    }));
  }

  // Normalise digits-only input
  function handleNationalPhoneChange(raw: string) {
    let d = digitsOnly(raw);

    // UK: store without the leading 0, replace with +44
    if (phoneCountry === "GB") d = d.replace(/^0+/, "");

    d = d.slice(0, maxNationalLen);

    setFormData((prev) => ({
      ...prev,
      phone: d ? dialCode + d : "",
    }));
  }

  // Determine if the postcode field has been filled
  const [postcodeTouched, setPostcodeTouched] = useState(false);

  const postcodeRaw = formData.postcode ?? "";
  const postcodeInvalid = provideDetails === "yes" && postcodeRaw.trim() !== "" && !isValidUkPostcode(postcodeRaw);

  return (
    <StepShell
      step={1}
      totalSteps={3}
      title="Council service request"
      subtitle="Please complete this form to help us support you today"
      languageValue={formData.language}
      onLanguageChange={(code) => setField("language", code as FormData["language"])}
      languageOptions={LANGUAGE_OPTIONS}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (provideDetails === "yes" && postcodeInvalid) {
            setPostcodeTouched(true);
            return;
          }
          nav("/form/step-2");
        }}
      >
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
          <Stack spacing={3}>
            {/* Info block */}
            <Alert
              severity="info"
              variant="outlined"
              icon={false}
              sx={(theme) => {
                const accent = theme.palette.primary.main;
                return {
                  borderRadius: 2,
                  py: 1.5,
                  borderColor: accent,
                  bgcolor: alpha(accent, 0.08),
                  "& .MuiAlert-message": { width: "100%" },
                  "& svg": { color: accent },
                };
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1 }}>
                <CheckCircleOutlineIcon fontSize="small" sx={{ mt: "2px", opacity: 0 }} aria-hidden />
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }} color="primary.main">
                  Your details (optional)
                </Typography>
              </Stack>

              <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: "none" }}>
                <Stack component="li" direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon fontSize="small" sx={{ mt: "2px" }} />
                  <Typography variant="body2" color="text.secondary">
                    Only council staff can view the information you provide.
                  </Typography>
                </Stack>

                <Stack component="li" direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon fontSize="small" sx={{ mt: "2px" }} />
                  <Typography variant="body2" color="text.secondary">
                    You can continue without providing details.
                  </Typography>
                </Stack>

                <Stack component="li" direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon fontSize="small" sx={{ mt: "2px" }} />
                  <Typography variant="body2" color="text.secondary">
                    If you want updates, add at least one contact method.
                  </Typography>
                </Stack>
              </Stack>
            </Alert>

            {/* Option to not provide details */}
            <FormControl component="fieldset">
              <FormLabel sx={{ fontWeight: 800, mb: 1 }}>Would you like to provide your details?</FormLabel>
              <RadioGroup
                value={provideDetails}
                onChange={(e) => handleProvideDetailsChange((e.target as HTMLInputElement).value as YesNo)}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes, I'd like to provide details (optional)" />
                <FormControlLabel value="no" control={<Radio />} label="No, continue without details" />
              </RadioGroup>
            </FormControl>

            {/* Personal details */}
            <Collapse in={provideDetails === "yes"} timeout={200} unmountOnExit>
              <Stack spacing={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Personal details
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <TextField
                    label="First name (optional)"
                    value={formData.firstName ?? ""}
                    onChange={(e) => setField("firstName", e.target.value)}
                    fullWidth
                    autoComplete="given-name"
                  />

                  <TextField
                    label="Last name (optional)"
                    value={formData.lastName ?? ""}
                    onChange={(e) => setField("lastName", e.target.value)}
                    fullWidth
                    autoComplete="family-name"
                  />
                </Box>

                {/* DOB */}
                <DatePicker
                  label="Date of birth (optional)"
                  value={dobValue}
                  disableFuture
                  openTo="year"
                  views={["year", "month", "day"]}
                  onChange={(date: Dayjs | null) => setField("dob", date ? date.format("YYYY-MM-DD") : null)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      slotProps: { htmlInput: { autoComplete: "bday" } },
                    },
                  }}
                />

                <Divider />

                {/* Contact details */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Contact details
                </Typography>

                <Stack spacing={2}>
                  {/* Email */}
                  <TextField
                    label="Email (optional)"
                    type="email"
                    value={formData.email ?? ""}
                    onChange={(e) => setField("email", e.target.value)}
                    fullWidth
                    autoComplete="email"
                    inputMode="email"
                  />

                  {/* Phone controls: type + country/dial + digits-only number */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel id="phone-type-label">Phone type (optional)</InputLabel>
                      <Select
                        labelId="phone-type-label"
                        label="Phone type (optional)"
                        value={(formData.phoneType ?? "") as PhoneType}
                        onChange={(e) => setField("phoneType", String(e.target.value) as FormData["phoneType"])}
                      >
                        <MenuItem value="">No selection</MenuItem>
                        <MenuItem value="Mobile">Mobile</MenuItem>
                        <MenuItem value="Home phone">Home phone</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel id="phone-country-label">Country / dial code</InputLabel>
                      <Select
                        labelId="phone-country-label"
                        label="Country / dial code"
                        value={phoneCountry}
                        onChange={(e) => handleCountryChange(String(e.target.value) as CountryCode)}
                      >
                        {dialOptions.map((opt) => (
                          <MenuItem key={opt.country} value={opt.country}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Phone number (optional)"
                      value={nationalDigits}
                      onChange={(e) => handleNationalPhoneChange(e.target.value)}
                      fullWidth
                      autoComplete="tel-national"
                      inputMode="numeric"
                      placeholder={phoneCountry === "GB" ? "e.g. 7912345678" : "Digits only"}
                      slotProps={{
                        htmlInput: {
                          maxLength: maxNationalLen,
                          pattern: "[0-9]*",
                        },
                      }}
                    />
                  </Box>

                  {/* Preferred contact method */}
                  <Box>
                    <Typography fontWeight={700} sx={{ mb: 1 }}>
                      Preferred method of contact (optional)
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={2} alignItems="flex-end">
                    <Box sx={{ flex: 1 }}>
                      <FormControl fullWidth>
                        <InputLabel id="contact-label">Select a contact method...</InputLabel>
                        <Select
                          labelId="contact-label"
                          label="Select a contact method..."
                          value={formData.contactMethod ?? ""}
                          onChange={(e) => setField("contactMethod", String(e.target.value) as ContactMethod)}
                        >
                          <MenuItem value="">Select a contact method...</MenuItem>
                          <MenuItem value="Text message">Text message</MenuItem>
                          <MenuItem value="Email">Email</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    {/* Small help box */}
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
                </Stack>
              </Stack>
            </Collapse>
            <Divider />

            {/* Address */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Address
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Address line 1 (optional)"
                value={formData.addressLine1 ?? ""}
                onChange={(e) => setField("addressLine1", e.target.value)}
                fullWidth
                autoComplete="address-line1"
              />

              <TextField
                label="Address line 2 (optional)"
                value={formData.addressLine2 ?? ""}
                onChange={(e) => setField("addressLine2", e.target.value)}
                fullWidth
                autoComplete="address-line2"
              />

              <TextField
                label="Address line 3 (optional)"
                value={formData.addressLine3 ?? ""}
                onChange={(e) => setField("addressLine3", e.target.value)}
                fullWidth
                autoComplete="address-line3"
              />

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 2 }}>
                <TextField
                  label="Town or city (optional)"
                  value={formData.townOrCity ?? ""}
                  onChange={(e) => setField("townOrCity", e.target.value)}
                  fullWidth
                  autoComplete="address-level2"
                />

                <TextField
                  label="Postcode (optional)"
                  value={formData.postcode ?? ""}
                  onChange={(e) => setField("postcode", e.target.value)}
                  onBlur={() => {
                    setPostcodeTouched(true);
                    setField("postcode", normaliseUkPostcode(formData.postcode ?? ""));
                  }}
                  error={postcodeTouched && postcodeInvalid}
                  helperText={
                    postcodeTouched && postcodeInvalid
                      ? "Enter a valid UK postcode (e.g. TW3 1JL) or leave blank."
                      : " "
                  }
                  fullWidth
                  autoComplete="postal-code"
                  placeholder="e.g. TW3 1JL"
                  slotProps={{
                    htmlInput: {
                      autoCapitalize: "characters",
                      spellCheck: false,
                    },
                  }}
                />
              </Box>
            </Stack>

            <Divider />

            <Divider />

            {/* Navigation Buttons */}
            <StepActions
              onSave={handleSave}
              advanceLabel="Continue"
              advanceDisabled={provideDetails === "yes" && postcodeInvalid}
            />
          </Stack>
        </Paper>
      </Box>
    </StepShell>
  );
}
