// src/pages/Form/components/WithTTS.tsx
/**
 * WithTTS
 *
 * Wrap a section and render a single TTS button for that section.
 *
 * Default behaviour:
 * - Reads copy.label
 *
 * Override behaviour:
 * - If copy.tts is provided, reads copy.tts instead
 */

import type { ReactNode } from "react";
import { Box, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import TextToSpeechButton from "../../../components/TextToSpeechButton";

export type TtsCopy = {
  label: string;
  tts?: string;
};

export default function WithTTS(props: {
  copy: TtsCopy;
  children: ReactNode;

  required?: boolean;
  titleVariant?: "subtitle1" | "subtitle2" | "h6";
  sx?: SxProps<Theme>;
}) {
  const t = (props.copy.tts ?? props.copy.label).trim();
  const titleVariant = props.titleVariant ?? "subtitle2";

  return (
    <Box sx={props.sx}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant={titleVariant} sx={{ fontWeight: 800 }}>
          {props.copy.label}
          {props.required ? (
            <Box component="span" sx={{ color: "error.main", ml: 0.5 }} aria-hidden>
              *
            </Box>
          ) : null}
        </Typography>

        {t ? <TextToSpeechButton text={t} /> : null}
      </Stack>

      {props.children}
    </Box>
  );
}
