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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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

export default function StepShell(props: Props) {
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Paper variant="outlined" sx={{ p: 6, borderWidth: 2, borderRadius: 2, bgcolor: "background.paper" }}>
          {/* Top row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          {props.step > 1 && props.onBack ? (
            <Button type="button" variant="text" onClick={props.onBack} sx={{ textTransform: "none" }}>
              <ArrowBackIcon sx={{ mr: 1 }} />
              Previous
            </Button>
          ) : (
            <Box sx={{ width: 80 }} />
          )}

          <TextToSpeechButton text={listenText} />
          </Stack>

          {/* Title + language */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {props.title}
              </Typography>
              {props.subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {props.subtitle}
                </Typography>
              )}
            </Box>

            <FormControl size="small" sx={{ minWidth: 220 }}>
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
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
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
