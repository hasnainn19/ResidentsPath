/**
 * Navigation buttons and actions for each step.
 *
 * Renders:
 * - The main advance button (Continue/Submit), which can be disabled.
 * - An optional Previous button.
 * - A "Save and continue later" button.
 *
 * The step decides when the advance button should be enabled, based on its rules.
 */

import { Box, Button, Divider, Stack } from "@mui/material";

type StepActionsProps = {
  onSave: () => void;

  advanceLabel: string;
  advanceType?: "button" | "submit";
  onAdvanceClick?: () => void;
  advanceDisabled?: boolean;

  showPrevious?: boolean;
  onPrevious?: () => void;
  previousLabel?: string;
};

export default function StepActions(props: StepActionsProps) {
  const {
    onSave,
    advanceLabel: advanceLabel,
    advanceType: advanceType = "submit",
    onAdvanceClick: onAdvanceClick,
    advanceDisabled: advanceDisabled = false,
    showPrevious = false,
    onPrevious,
    previousLabel = "<- Previous",
  } = props;

  return (
    <Box sx={{ pt: 2 }}>
      <Divider sx={{ mb: 3 }} />

      <Stack direction="row" spacing={2}>
        <Button type="button" variant="outlined" color="primary" fullWidth onClick={onSave}>
          Save and continue later
        </Button>

        <Button
          type={advanceType}
          variant="contained"
          color="primary"
          fullWidth
          disabled={advanceDisabled}
          onClick={onAdvanceClick}
        >
          {advanceLabel}
        </Button>
      </Stack>

      {showPrevious && (
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Button type="button" onClick={onPrevious} sx={{ textTransform: "none" }}>
            {previousLabel}
          </Button>
          <Box />
        </Stack>
      )}
    </Box>
  );
}
