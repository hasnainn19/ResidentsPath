/**
 * Layout used by each form page.
 *
 * Provides the shared header and structure across all steps, including:
 * - Title/subtitle area
 * - Step progress indicator
 * - Language selector
 * - TTS instructions action
 * - Back button when not on Step 1
 *
 * Also scrolls to the top when a step loads.
 */

import type { ReactNode } from "react";
import {
  Box,
  Button,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { LanguageOption } from "../../pages/Form/model/formFieldTypes";
import { useEffect } from "react";
import TextToSpeechButton from "../TextToSpeechButton";

type Props = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;

  onBack?: () => void;

  languageValue: string;
  onLanguageChange: (code: string) => void;
  languageOptions: LanguageOption[];

  children: ReactNode;
};

export default function FormStepLayout(props: Props) {
  const percent = Math.round((props.step / props.totalSteps) * 100);

  // Scroll to top when step changes so that user always starts at the top of the form
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // Combine the title, subtitle, and step info into one string for TTS, filtering out any empty values
  const listenText = [props.title, props.subtitle, `Step ${props.step} of ${props.totalSteps}.`]
    .filter(Boolean)
    .join(". ");

  return (
      <Box
        sx={{
          minHeight: "100vh",
          "@supports (height: 100svh)": { minHeight: "100svh" },
          bgcolor: "background.default",
          py: { xs: 2, sm: 4 },
        }}
      >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 6 },
            borderWidth: { xs: 1, sm: 2 },
            borderRadius: 2,
            bgcolor: "background.paper",
          }}
        >
          {/* Top row */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            flexWrap={{ xs: "wrap", sm: "nowrap" }}
            rowGap={1}
            sx={{ mb: { xs: 1.5, sm: 2 } }}
          >
            {props.step > 1 && props.onBack ? (
              <Button
                type="button"
                variant="text"
                onClick={props.onBack}
                sx={{ textTransform: "none" }}
              >
                <ArrowBackIcon sx={{ mr: 1 }} />
                Previous
              </Button>
            ) : (
              <Box sx={{ width: { xs: 0, sm: 80 } }} />
            )}

            <TextToSpeechButton text={listenText} />
          </Stack>

          {/* Title + language */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "flex-start" }}
            spacing={{ xs: 1.5, sm: 0 }}
            sx={{ mb: { xs: 2, sm: 3 } }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800}>
                {props.title}
              </Typography>
              {props.subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {props.subtitle}
                </Typography>
              )}
            </Box>

            <FormControl
              size="small"
              sx={{ minWidth: { xs: 0, sm: 220 }, width: { xs: "100%", sm: "auto" } }}
            >
              <InputLabel id="lang-label">Language</InputLabel>
              <Select
                labelId="lang-label"
                label="Language"
                value={props.languageValue}
                onChange={(e) => props.onLanguageChange(String(e.target.value))}
              >
                {props.languageOptions.map((opt) => (
                  <MenuItem key={opt.code} value={opt.code}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Progress */}
          <Box sx={{ display: { xs: "block", sm: "none" }, mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight={700}>
                Step {props.step} of {props.totalSteps}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {percent}% complete
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={percent} />
          </Box>

          <Paper
            variant="outlined"
            sx={{ display: { xs: "none", sm: "block" }, p: 3, borderRadius: 2, mb: 3 }}
          >
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" fontWeight={700}>
                Step {props.step} of {props.totalSteps}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {percent}% complete
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={percent} />
          </Paper>

          {/* Step content */}
          {props.children}
        </Paper>
      </Container>
    </Box>
  );
}
