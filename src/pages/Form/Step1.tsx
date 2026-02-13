import { useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  Button,
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

type PhoneType = "" | "Mobile" | "Home phone";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

export default function Step1() {
  const nav = useNavigate();
  const { formData, setFormData } = useFormWizard();

  // TODO(BACKEND): Replace with Text-to-Speech
  const handleListenAll = () => alert("Reading instructions (mock)");

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  const provideDetails: YesNo = formData.provideDetails ?? "yes";
  const dobValue = formData.dob ? dayjs(formData.dob) : null;

  // TODO(BACKEND)
  const handleSave = () => alert("Saved (mock)");

  // If the user says no, wipe the personal fields
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
        };
      }

      return next;
    });
  }

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

  const nationalDigits =
    formData.phone && formData.phone.startsWith(dialCode) ? digitsOnly(formData.phone.slice(dialCode.length)) : "";

  const maxNationalLen = phoneCountry === "GB" ? 10 : 15;

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

  function handleNationalPhoneChange(raw: string) {
    let d = digitsOnly(raw);

    // UK: store without the leading 0 with +44
    if (phoneCountry === "GB") d = d.replace(/^0+/, "");

    d = d.slice(0, maxNationalLen);

    setFormData((prev) => ({
      ...prev,
      phone: d ? dialCode + d : "",
    }));
  }

  return (
    <StepShell
      step={1}
      totalSteps={3}
      title="Council service request"
      subtitle="Please complete this form to help us support you today"
      onListenAll={handleListenAll}
      languageValue={formData.language}
      onLanguageChange={(code) => setField("language", code as FormData["language"])}
      languageOptions={LANGUAGE_OPTIONS}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
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
                          <MenuItem value="Phone call">Phone call</MenuItem>
                          <MenuItem value="Email">Email</MenuItem>
                          <MenuItem value="Letter">Letter</MenuItem>
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

            {/* Navigation Buttons */}
            <Box sx={{ pt: 2 }}>
              <Divider sx={{ mb: 3 }} />
              <Stack direction="row" spacing={2}>
                <Button type="button" variant="outlined" color="primary" fullWidth onClick={handleSave}>
                  Save and continue later
                </Button>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                  Continue
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </StepShell>
  );
}
