import { Button, Stack, TextField } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";

import WithTTS, { type TtsCopy } from "./WithTTS";

type Props = {
  copy: TtsCopy;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  minRows?: number;
  titleVariant?: "subtitle1" | "subtitle2" | "h6";
  required?: boolean;
  extraHelperText?: string;
  showVoiceInput?: boolean;
  onVoiceInput?: () => void;
  voiceInputLabel?: string;
};

export default function LongTextSection(props: Props) {
  return (
    <WithTTS copy={props.copy} required={props.required} titleVariant={props.titleVariant}>
      <TextField
        fullWidth
        multiline
        minRows={props.minRows ?? 4}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        helperText={
          props.extraHelperText
            ? `${props.value.length}/${props.maxLength} characters. ${props.extraHelperText}`
            : `${props.value.length}/${props.maxLength} characters.`
        }
        slotProps={{ htmlInput: { maxLength: props.maxLength } }}
      />

      {props.showVoiceInput ? (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 0.5 }}
        >
          <MicIcon fontSize="small" />
          <Button
            type="button"
            size="small"
            onClick={props.onVoiceInput}
            sx={{ textTransform: "none" }}
          >
            {props.voiceInputLabel ?? "Voice input"}
          </Button>
        </Stack>
      ) : null}
    </WithTTS>
  );
}
