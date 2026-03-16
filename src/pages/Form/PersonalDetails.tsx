/**
 * Personal Details: optional resident details.
 *
 * Starts by asking whether the resident wants to provide personal/contact details at all.
 * If they choose not to, the related fields are cleared so they do not appear later.
 *
 * If details are provided, this step collects basic info (eg name, DOB, email/phone, preferred
 * contact method) and then moves on to enquiry selection for the actual request/triage.
 */

import { useState, useMemo } from "react";
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
  FormHelperText,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";

import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";

import FormStepLayout from "../../components/FormPageComponents/FormStepLayout";
import { outlinedInfoAlertSx } from "../../components/FormPageComponents/outlinedInfoAlertSx";
import WithTTS from "../../components/FormPageComponents/WithTTS";
import TextToSpeechButton from "../../components/TextToSpeechButton";
import { useFormWizard } from "../../context/FormWizardProvider";
import type { ContactMethod, YesNo, FormData, PronounsOption } from "./model/formFieldTypes";
import {
  getSupportedPhoneCountry,
  UI_OPTIONS,
  isValidEmail,
  isValidUkPostcode,
  normalisePhoneToE164,
  normaliseUkPostcode,
} from "../../../shared/formSchema";
import StepActions from "../../components/FormPageComponents/StepActions";
import { FIELD_META } from "./model/fieldMeta";

// Remove all non-digit characters from a string
function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

export default function PersonalDetails() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave } = useFormWizard();

  const labelOptional = (key: keyof FormData) => FIELD_META[key].label + " (optional)";

  const COPY = {
    info: {
      label: "Your details (optional)",
      tts: "Your details are optional. Only council staff can view the information you provide. You can continue without providing details. If you want updates, add at least one contact method.",
    },
    provideDetails: {
      label: "Would you like to provide your details?",
      tts: "Would you like to provide your details? Choose yes to provide optional details, or no to continue without details.",
    },
    personalDetails: {
      label: "Personal details",
      tts: "Personal details. Pronouns, preferred name, first name, middle name, last name, and date of birth are optional.",
    },
    contactDetails: {
      label: "Contact details",
      tts: "Contact details. Email and phone are optional. You can also select a preferred contact method if you want updates.",
    },
    address: {
      label: "Address",
      tts: "Address. Address lines, town or city, and postcode are optional.",
    },
  } as const;

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
          middleName: "",
          lastName: "",
          preferredName: "",
          dob: "",
          email: "",
          phone: "",
          phoneCountry: "GB",
          contactMethod: "" as "" | ContactMethod,
          addressLine1: "",
          addressLine2: "",
          addressLine3: "",
          townOrCity: "",
          postcode: "",
          pronouns: "" as PronounsOption,
          pronounsOtherText: "",
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

  const dialOptions = useMemo(() => buildDialOptions(), []);

  const phoneCountry = getSupportedPhoneCountry(formData.phoneCountry) ?? "GB";
  const dialCode = "+" + getCountryCallingCode(phoneCountry);
  const normalisedPhone = formData.phone
    ? normalisePhoneToE164(formData.phone, phoneCountry)
    : undefined;

  // UI edits the national part, state stores the full number with dial code
  const nationalDigits =
    (normalisedPhone ?? formData.phone) && (normalisedPhone ?? formData.phone).startsWith(dialCode)
      ? digitsOnly((normalisedPhone ?? formData.phone).slice(dialCode.length))
      : "";

  // Soft length cap to prevent very long inputs
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

    if (phoneCountry === "GB") d = d.replace(/^0+/, "");

    d = d.slice(0, maxNationalLen);

    setFormData((prev) => ({
      ...prev,
      phone: d ? dialCode + d : "",
    }));
  }

  // Determine if the postcode field has been filled
  const [postcodeTouched, setPostcodeTouched] = useState(false);

  const [contactMethodTouched, setContactMethodTouched] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);

  const [phoneTouched, setPhoneTouched] = useState(false);

  const postcodeRaw = formData.postcode ?? "";
  const postcodeInvalid =
    provideDetails === "yes" && postcodeRaw.trim() !== "" && !isValidUkPostcode(postcodeRaw);

  const emailRaw = (formData.email ?? "").trim();
  const emailInvalid = provideDetails === "yes" && emailRaw !== "" && !isValidEmail(emailRaw);

  const phoneInvalid =
    provideDetails === "yes" &&
    formData.phone.trim() !== "" &&
    !normalisedPhone;

  const needsPhoneForContactMethod =
    provideDetails === "yes" &&
    formData.contactMethod === "TEXT_MESSAGE" &&
    formData.phone.trim() === "";

  const needsEmailForContactMethod =
    provideDetails === "yes" && formData.contactMethod === "EMAIL" && formData.email.trim() === "";

  // If the user has touched the contact method field, validate that they have provided the necessary contact details for their chosen method
  const contactMethodInvalid = needsPhoneForContactMethod || needsEmailForContactMethod;

  return (
    <FormStepLayout
      step={2}
      totalSteps={4}
      title="Council service request"
      subtitle="Please complete this form to help us support you today"
      onBack={() => nav("/form/enquiry-selection")}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();

          const mostRecentPostcode = normaliseUkPostcode(formData.postcode ?? "");
          const postcodeInvalidNow =
            provideDetails === "yes" &&
            mostRecentPostcode.trim() !== "" &&
            !isValidUkPostcode(mostRecentPostcode);

          if (
            provideDetails === "yes" &&
            (postcodeInvalidNow || contactMethodInvalid || emailInvalid || phoneInvalid)
          ) {
            setPostcodeTouched(true);
            setContactMethodTouched(true);
            setEmailTouched(true);
            setPhoneTouched(true);
            return;
          }

          // Ensure consistent formatting even if the user never blurs the field
          if (mostRecentPostcode !== (formData.postcode ?? "")) {
            setFormData((prev) => ({ ...prev, postcode: mostRecentPostcode }));
          }

          nav("/form/actions");
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 0, sm: 4 },
            borderRadius: { xs: 0, sm: 2 },
            borderWidth: { xs: 0, sm: 1 },
            bgcolor: { xs: "transparent", sm: "background.paper" },
          }}
        >
          <Stack spacing={{ xs: 2.5, sm: 3 }}>
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
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                flexWrap="wrap"
                columnGap={1}
                rowGap={0.75}
                sx={{ mb: 1 }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon
                    fontSize="small"
                    sx={{ mt: "2px", opacity: 0 }}
                    aria-hidden
                  />
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, lineHeight: 1.2 }}
                    color="primary.main"
                  >
                    {COPY.info.label}
                  </Typography>
                </Stack>

                <TextToSpeechButton text={(COPY.info.tts ?? COPY.info.label).trim()} />
              </Stack>

              <Stack
                component="ul"
                spacing={{ xs: 0.75, sm: 1 }}
                sx={{ m: 0, p: 0, listStyle: "none" }}
              >
                <Stack component="li" direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon fontSize="small" sx={{ mt: "2px" }} aria-hidden />
                  <Typography variant="body2" color="text.secondary">
                    Only council staff can view the information you provide.
                  </Typography>
                </Stack>

                <Stack component="li" direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon fontSize="small" sx={{ mt: "2px" }} aria-hidden />
                  <Typography variant="body2" color="text.secondary">
                    You can continue without providing details.
                  </Typography>
                </Stack>

                <Stack component="li" direction="row" spacing={1} alignItems="flex-start">
                  <CheckCircleOutlineIcon fontSize="small" sx={{ mt: "2px" }} aria-hidden />
                  <Typography variant="body2" color="text.secondary">
                    If you want updates, add at least one contact method.
                  </Typography>
                </Stack>
              </Stack>
            </Alert>

            {/* Option to not provide details */}
            <FormControl component="fieldset">
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                flexWrap="wrap"
                columnGap={1}
                rowGap={0.75}
                sx={{ mb: 1 }}
              >
                <FormLabel sx={{ fontWeight: 800 }}>{COPY.provideDetails.label}</FormLabel>
                <TextToSpeechButton
                  text={(COPY.provideDetails.tts ?? COPY.provideDetails.label).trim()}
                />
              </Stack>

              <RadioGroup
                value={provideDetails}
                onChange={(e) =>
                  handleProvideDetailsChange((e.target as HTMLInputElement).value as YesNo)
                }
              >
                <FormControlLabel
                  value="yes"
                  control={<Radio />}
                  label="Yes, I'd like to provide details (optional)"
                />
                <FormControlLabel
                  value="no"
                  control={<Radio />}
                  label="No, continue without details"
                />
              </RadioGroup>
            </FormControl>

            {/* Personal details */}
            <Collapse in={provideDetails === "yes"} timeout={200} unmountOnExit>
              <Stack spacing={{ xs: 1.5, sm: 2 }}>
                <WithTTS copy={COPY.personalDetails} titleVariant="subtitle1">
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
                        gap: 2,
                        alignItems: "start",
                      }}
                    >
                      <Stack spacing={1}>
                        <FormControl fullWidth>
                          <InputLabel id="pronouns-label">{labelOptional("pronouns")}</InputLabel>
                          <Select
                            labelId="pronouns-label"
                            label={labelOptional("pronouns")}
                            value={formData.pronouns}
                            onChange={(e) => {
                              const v = String(
                                (e.target as HTMLInputElement).value,
                              ) as FormData["pronouns"];
                              setFormData((prev) => ({
                                ...prev,
                                pronouns: v,
                                pronounsOtherText: v === "OTHER" ? prev.pronounsOtherText : "",
                              }));
                            }}
                          >
                            <MenuItem value="">No selection</MenuItem>
                            {UI_OPTIONS.pronouns.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {formData.pronouns === "OTHER" && (
                          <TextField
                            label="Pronouns (please specify)"
                            value={formData.pronounsOtherText}
                            onChange={(e) => setField("pronounsOtherText", e.target.value)}
                            fullWidth
                            slotProps={{
                              htmlInput: { maxLength: FIELD_META.pronounsOtherText.maxLen },
                            }}
                          />
                        )}
                      </Stack>

                      <TextField
                        label={labelOptional("preferredName")}
                        value={formData.preferredName ?? ""}
                        onChange={(e) => setField("preferredName", e.target.value)}
                        fullWidth
                        autoComplete="nickname"
                        slotProps={{ htmlInput: { maxLength: FIELD_META.preferredName.maxLen } }}
                      />
                    </Box>

                    {/* Names row */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <TextField
                        label={labelOptional("firstName")}
                        value={formData.firstName ?? ""}
                        onChange={(e) => setField("firstName", e.target.value)}
                        fullWidth
                        autoComplete="given-name"
                        slotProps={{ htmlInput: { maxLength: FIELD_META.firstName.maxLen } }}
                      />

                      <TextField
                        label={labelOptional("middleName")}
                        value={formData.middleName ?? ""}
                        onChange={(e) => setField("middleName", e.target.value)}
                        fullWidth
                        autoComplete="additional-name"
                        slotProps={{ htmlInput: { maxLength: FIELD_META.middleName.maxLen } }}
                      />

                      <TextField
                        label={labelOptional("lastName")}
                        value={formData.lastName ?? ""}
                        onChange={(e) => setField("lastName", e.target.value)}
                        fullWidth
                        autoComplete="family-name"
                        slotProps={{ htmlInput: { maxLength: FIELD_META.lastName.maxLen } }}
                      />
                    </Box>

                    {/* DOB */}
                    <DatePicker
                      label={labelOptional("dob")}
                      value={dobValue}
                      disableFuture
                      openTo="year"
                      views={["year", "month", "day"]}
                      onChange={(date: Dayjs | null) =>
                        setFormData((prev) => ({
                          ...prev,
                          dob: date ? date.format("YYYY-MM-DD") : "",
                          ageRange: date ? "" : prev.ageRange,
                        }))
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          slotProps: { htmlInput: { autoComplete: "bday" } },
                        },
                      }}
                    />
                  </Stack>
                </WithTTS>

                <Divider sx={{ display: { xs: "none", sm: "block" } }} />

                {/* Contact details */}
                <WithTTS copy={COPY.contactDetails} titleVariant="subtitle1">
                  <Stack spacing={{ xs: 1.5, sm: 2 }}>
                    <Alert
                      severity="info"
                      variant="outlined"
                      sx={outlinedInfoAlertSx}
                    >
                      We only use your email address or phone number for this request and for the
                      updates you ask us to send.
                    </Alert>

                    <TextField
                      label={labelOptional("email")}
                      type="email"
                      value={formData.email ?? ""}
                      onChange={(e) => setField("email", e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      error={emailTouched && emailInvalid}
                      helperText={
                        emailTouched && emailInvalid
                          ? "Enter a valid email address or leave blank."
                          : " "
                      }
                      fullWidth
                      autoComplete="email"
                      slotProps={{
                        htmlInput: { maxLength: FIELD_META.email.maxLen, inputMode: "email" },
                      }}
                    />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <FormControl fullWidth>
                        <InputLabel id="phone-country-label">Country / dial code</InputLabel>
                        <Select
                          labelId="phone-country-label"
                          label="Country / dial code"
                          value={phoneCountry}
                          onChange={(e) =>
                            handleCountryChange(String(e.target.value) as CountryCode)
                          }
                        >
                          {dialOptions.map((opt) => (
                            <MenuItem key={opt.country} value={opt.country}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {/* Phone controls: country/dial + digits-only number */}
                      <TextField
                        label={labelOptional("phone")}
                        value={nationalDigits}
                        onChange={(e) => handleNationalPhoneChange(e.target.value)}
                        onBlur={() => setPhoneTouched(true)}
                        error={phoneTouched && phoneInvalid}
                        helperText={
                          phoneTouched && phoneInvalid
                            ? "Enter a valid phone number or leave blank."
                            : " "
                        }
                        fullWidth
                        autoComplete="tel-national"
                        placeholder={phoneCountry === "GB" ? "e.g. 7912345678" : "Digits only"}
                        slotProps={{
                          htmlInput: {
                            maxLength: maxNationalLen,
                            pattern: "[0-9]*",
                            inputMode: "numeric",
                          },
                        }}
                      />
                    </Box>

                    <FormControl fullWidth error={contactMethodTouched && contactMethodInvalid}>
                      <InputLabel id="contact-label">{labelOptional("contactMethod")}</InputLabel>
                      <Select
                        labelId="contact-label"
                        label={labelOptional("contactMethod")}
                        value={formData.contactMethod ?? ""}
                        onChange={(e) => {
                          setField("contactMethod", String(e.target.value) as ContactMethod);
                          setContactMethodTouched(true);
                        }}
                        onBlur={() => setContactMethodTouched(true)}
                      >
                        <MenuItem value="">Contact method (optional)</MenuItem>
                        {UI_OPTIONS.contactMethod.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>

                      <FormHelperText>
                        {contactMethodTouched && contactMethodInvalid
                          ? needsPhoneForContactMethod
                            ? "To use Text message, add a phone number above."
                            : "To use Email, add an email address above."
                          : "We will use this to update you on your request."}
                      </FormHelperText>
                    </FormControl>
                  </Stack>
                </WithTTS>

                <Divider sx={{ display: { xs: "none", sm: "block" } }} />

                {/* Address */}
                <WithTTS copy={COPY.address} titleVariant="subtitle1">
                  <Stack spacing={{ xs: 1.5, sm: 2 }}>
                    <TextField
                      label={labelOptional("addressLine1")}
                      value={formData.addressLine1 ?? ""}
                      onChange={(e) => setField("addressLine1", e.target.value)}
                      fullWidth
                      autoComplete="address-line1"
                      slotProps={{ htmlInput: { maxLength: FIELD_META.addressLine1.maxLen } }}
                    />

                    <TextField
                      label={labelOptional("addressLine2")}
                      value={formData.addressLine2 ?? ""}
                      onChange={(e) => setField("addressLine2", e.target.value)}
                      fullWidth
                      autoComplete="address-line2"
                      slotProps={{ htmlInput: { maxLength: FIELD_META.addressLine2.maxLen } }}
                    />

                    <TextField
                      label={labelOptional("addressLine3")}
                      value={formData.addressLine3 ?? ""}
                      onChange={(e) => setField("addressLine3", e.target.value)}
                      fullWidth
                      autoComplete="address-line3"
                      slotProps={{ htmlInput: { maxLength: FIELD_META.addressLine3.maxLen } }}
                    />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 220px" },
                        gap: 2,
                      }}
                    >
                      <TextField
                        label={labelOptional("townOrCity")}
                        value={formData.townOrCity ?? ""}
                        onChange={(e) => setField("townOrCity", e.target.value)}
                        fullWidth
                        autoComplete="address-level2"
                        slotProps={{ htmlInput: { maxLength: FIELD_META.townOrCity.maxLen } }}
                      />

                      <TextField
                        label={labelOptional("postcode")}
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
                            maxLength: FIELD_META.postcode.maxLen,
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </WithTTS>
              </Stack>
            </Collapse>

            {/* Navigation Buttons */}
            <StepActions
              onSave={handleSave}
              advanceLabel="Continue"
              showPrevious
              onPrevious={() => nav("/form/enquiry-selection")}
              advanceDisabled={
                provideDetails === "yes" &&
                (postcodeInvalid || contactMethodInvalid || emailInvalid || phoneInvalid)
              }
            />
          </Stack>
        </Paper>
      </Box>
    </FormStepLayout>
  );
}
