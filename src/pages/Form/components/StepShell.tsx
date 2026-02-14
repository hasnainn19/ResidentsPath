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
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import type { LanguageOption } from "../model/types";
import { useEffect } from "react";

type Props = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;

  onBack?: () => void;
  onListenAll: () => void;

  languageValue: string;
  onLanguageChange: (code: string) => void;
  languageOptions: LanguageOption[];

  children: ReactNode;
};

export default function StepShell(props: Props) {
  const percent = Math.round((props.step / props.totalSteps) * 100);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);
  
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="lg">
        <Paper variant="outlined" sx={{ p: 6, borderWidth: 2, borderRadius: 2, bgcolor: "background.paper" }}>
          {/* Top row */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          {props.step > 1 && props.onBack ? (
            <Button type="button" variant="text" onClick={props.onBack} sx={{ textTransform: "none" }}>
              {"<-"} Back
            </Button>
          ) : (
            <Box sx={{ width: 80 }} />
          )}



            <Button
              variant="contained"
              color="secondary"
              startIcon={<VolumeUpIcon />}
              onClick={props.onListenAll}
              sx={{ textTransform: "none", color: "primary.main" }}
            >
              Listen to instructions
            </Button>
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
