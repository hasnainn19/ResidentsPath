/**
 * Navigation buttons and actions for each step.
 *
 * Renders:
 * - The main advance button (Continue/Submit), which can be disabled.
 * - An optional Previous button.
 * - An optional "Save and continue later" button.
 *
 * The step decides when the advance button should be enabled, based on its rules.
 */

import { Box, Button, Divider, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type StepActionsProps = {
  onSave: () => void;

  advanceLabel: string;
  advanceType?: "button" | "submit";
  onAdvanceClick?: () => void;
  advanceDisabled?: boolean;

  showPrevious?: boolean;
  onPrevious?: () => void;
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
  } = props;

  return (
    <Box sx={{ pt: 2 }}>
      <Divider sx={{ mb: { xs: 2.5, sm: 3 } }} />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.5, sm: 2 }}>
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

      {showPrevious ? (
        <>
          <Box sx={{ display: { xs: "block", sm: "none" }, mt: 1.5 }}>
            <Button type="button" onClick={onPrevious} sx={{ textTransform: "none", ml: -1 }}>
              <ArrowBackIcon sx={{ mr: 1 }} /> Previous
            </Button>
          </Box>

          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ display: { xs: "none", sm: "flex" }, mt: 2 }}
          >
            <Button type="button" onClick={onPrevious} sx={{ textTransform: "none" }}>
              <ArrowBackIcon sx={{ mr: 1 }} /> Previous
            </Button>
            <Box />
          </Stack>
        </>
      ) : null}
    </Box>
  );
}
