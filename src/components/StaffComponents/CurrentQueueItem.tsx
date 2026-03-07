import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import { useState } from "react";

interface CurrentQueueItemProps {
  caseItem: {
    id: string;
    service: string;
    title: string;
    description: string;
    status: "Priority" | "Standard";
    position: number;
  };
  totalPositions: number;
  handleSelectPosition: (caseId: string, position: number) => void;
  showPosition: boolean;
}
const CurrentQueueItem = (props: CurrentQueueItemProps) => {
  const { showPosition, caseItem, totalPositions, handleSelectPosition } =
    props;
  const [isFlagged, setIsFlagged] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const positionOptions = Array.from(
    { length: totalPositions },
    (_, index) => index + 1,
  );
  const statusColorMap: Record<string, "error" | "default"> = {
    Priority: "error",
    Standard: "default",
  };
  return (
    <Card key={caseItem.id} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} mb={1}>
              <Chip
                label={caseItem.status}
                color={statusColorMap[caseItem.status]}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                #{caseItem.id}
              </Typography>
            </Stack>

            <Typography variant="h6" fontWeight={600} gutterBottom>
              {caseItem.title}
            </Typography>

            <Divider sx={{ mb: 1 }} />

            <Box
              sx={{
                height: 120,
                overflowY: "scroll",
                scrollbarGutter: "stable",
                pr: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "pre-line" }}
              >
                {caseItem.description}
              </Typography>
            </Box>
          </Box>

          <Stack
            alignItems="stretch"
            justifyContent="space-between"
            sx={{ flexShrink: 0, minWidth: 140, ml: 2 }}
          >
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Tooltip title="Safeguarding flag">
                <IconButton size="small" onClick={() => setIsFlagged(!isFlagged)}>
                  <FlagIcon color={isFlagged ? "error" : "disabled"} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Priority flag">
                <IconButton size="small" onClick={() => setIsPriority(!isPriority)}>
                  <PriorityHighIcon color={isPriority ? "error" : "disabled"} />
                </IconButton>
              </Tooltip>
            </Box>
            <Stack spacing={1.5} alignItems="stretch">
              {showPosition && (
                <FormControl size="small">
                  <InputLabel id={`move-position-label-${caseItem.id}`}>
                    Move to position
                  </InputLabel>
                  <Select
                    labelId={`move-position-label-${caseItem.id}`}
                    label="Move to position"
                    value={String(Math.min(caseItem.position, totalPositions))}
                    onChange={(event) =>
                      handleSelectPosition(
                        caseItem.id,
                        Number(event.target.value),
                      )
                    }
                  >
                    {positionOptions.map((position) => (
                      <MenuItem key={position} value={String(position)}>
                        {position}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Button
                variant="outlined"
                size="small"
                sx={{ whiteSpace: "nowrap", fontSize: "0.75rem", px: 1 }}
              >
                Mark as Seen
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{ whiteSpace: "nowrap", fontSize: "0.75rem", px: 1 }}
                onClick={() => setNotesOpen(true)}
              >
                View/Edit Notes
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>

      <Dialog
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Notes — {caseItem.title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            fullWidth
            minRows={6}
            placeholder="Add notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setNotesOpen(false)}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default CurrentQueueItem;
