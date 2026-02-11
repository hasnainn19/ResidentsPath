import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert, Box, Button, Checkbox, Container, Divider, FormControl, FormControlLabel, FormGroup,
  FormHelperText, InputLabel, LinearProgress, MenuItem, Paper, Radio, RadioGroup, Select,
  Stack, TextField, Typography,
} from "@mui/material";

import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MicIcon from "@mui/icons-material/Mic";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

type Language = "en" | "cy" | "pl" | "ur";
type Service = "" | "Housing" | "Social Care" | "Benefits" | "Council Tax" | "Other";
type HousingType =
  | ""
  | "Homelessness support"
  | "Housing repairs"
  | "Housing application"
  | "Rent arrears"
  | "Other housing issue";

type Urgency = "yes" | "no" | "unsure";
type Proceed = "" | "Join digital queue" | "Schedule appointment" | "Request callback";
type ContactMethod = "" | "Text message" | "Phone call" | "Email" | "Letter";

type Count = "0" | "1" | "2" | "3" | "4" | "5" | "6+";

type AgeBand = "" | "Under 18" | "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65-74" | "75+" | "Prefer not to say";

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

type SafeToContact = "yes" | "no" | "prefer_not_to_say";

type FormData = {
  language: Language;
  service: Service;

  housingType: HousingType;

  // Priority questions
  ageBand: AgeBand;
  householdSize: HouseholdSize;

  hasChildren: boolean;
  childrenCount: Count;

  hasDisabilityOrSensory: boolean;
  disabilityType: DisabilityType;

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

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function Step2() {
  const nav = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    language: "en",
    service: "",

    housingType: "",

    ageBand: "",
    householdSize: "",

    hasChildren: false,
    childrenCount: "0",

    hasDisabilityOrSensory: false,
    disabilityType: "",

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

  const [errors, setErrors] = useState<FormErrors>({});

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // TODO(BACKEND): Replace with Text-to-Speech
  const handleListenAll = () => alert("Reading instructions (mock)");

  // TODO(BACKEND): Replace with Speech-to-Text
  const handleVoiceInput = () => alert("Voice input started (mock)");

  // TODO(BACKEND): Save draft
  const handleSave = () => alert("Saved (mock)");

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!formData.service) next.service = "Please select a service.";
    if (formData.service === "Housing" && !formData.housingType) {
      next.housingType = "Please select the type of Housing issue.";
    }
    if (!formData.proceed) next.proceed = "Please select how you'd like to proceed.";
    if (!formData.contactMethod) next.contactMethod = "Please select a contact method.";

    if (formData.hasChildren && formData.childrenCount === "0") {
      next.childrenCount = "Please select how many children (or untick the option).";
    }
    if (formData.hasDisabilityOrSensory && !formData.disabilityType) {
      next.disabilityType = "Please select an option (or choose Prefer not to say).";
    }
    if (formData.domesticAbuseRelated && formData.safeToContact === "no" && !formData.safeContactNotes.trim()) {
      next.safeContactNotes = "Please add safe contact notes (or choose Prefer not to say).";
    }

    return next;
  }

  const isElderly = formData.ageBand === "65-74" || formData.ageBand === "75+";
  const isLargeHousehold = formData.householdSize === "6+";

  return null;
}
