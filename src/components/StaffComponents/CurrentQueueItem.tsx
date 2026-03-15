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
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import EditIcon from "@mui/icons-material/Edit";
import React, { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import ConfirmChangeModal from "./ConfirmChangeModal";

const client = generateClient<Schema>({ authMode: "userPool" });

interface CurrentQueueItemProps {
  caseItem: {
    id: string;
    caseId: string;
    ticketNumber: string;
    department: string;
    title: string;
    description: string;
    status: "Priority" | "Standard";
    isFlagged: boolean;
    position: number;
    notes: string | null;
  };
  totalPositions: number;
  handleSelectPosition: (caseId: string, position: number) => void;
  handleMarkSeen: (ticketId: string) => void;
  showPosition: boolean;
}
const CurrentQueueItem = (props: CurrentQueueItemProps) => {
  const {
    showPosition,
    caseItem,
    totalPositions,
    handleSelectPosition,
    handleMarkSeen,
  } = props;
  const [isFlagged, setIsFlagged] = useState(caseItem.isFlagged);
  const [localStatus, setLocalStatus] = useState<"Priority" | "Standard">(
    caseItem.status,
  );
  const [priorityAnchor, setPriorityAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [prioritySaving, setPrioritySaving] = useState(false);
  const [flagSaving, setFlagSaving] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(caseItem.notes ?? "");
  const [confirmNotesOpen, setConfirmNotesOpen] = useState(false);
  const [confirmSeenOpen, setConfirmSeenOpen] = useState(false);
  const positionOptions = Array.from(
    { length: totalPositions },
    (_, index) => index + 1,
  );
  const statusColorMap: Record<string, "error" | "default"> = {
    Priority: "error",
    Standard: "default",
  };

  const handleTogglePriority = async () => {
    const newStatus = localStatus === "Standard" ? "Priority" : "Standard";
    setPriorityAnchor(null);
    setPrioritySaving(true);
    try {
      await client.mutations.setCasePriority({
        caseId: caseItem.caseId,
        priority: newStatus === "Priority",
      });
      setLocalStatus(newStatus);
    } catch (e) {
      console.error("CurrentQueueItem: setCasePriority failed", e);
    } finally {
      setPrioritySaving(false);
    }
  };

  const handleToggleFlag = async () => {
    const newFlagged = !isFlagged;
    setFlagSaving(true);
    try {
      await client.mutations.flagCaseSafeguarding({
        caseId: caseItem.caseId,
        flagged: newFlagged,
      });
      setIsFlagged(newFlagged);
    } catch (e) {
      console.error("CurrentQueueItem: flagCaseSafeguarding failed", e);
    } finally {
      setFlagSaving(false);
    }
  };

  const handlePositionChange = (event: { target: { value: string } }) =>
    handleSelectPosition(caseItem.id, Number(event.target.value));

  const handleSaveNotes = async () => {
    try {
      await client.models.Ticket.update({ id: caseItem.id, notes });
    } catch (error) {
      console.error(`Failed to save note for case:${caseItem.caseId}`);
    } finally {
      setConfirmNotesOpen(false);
      setNotesOpen(false);
    }
  };

  return (
    <Card key={caseItem.id} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} mb={1} alignItems="center">
              <Chip
                label={localStatus}
                color={statusColorMap[localStatus]}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                #{caseItem.ticketNumber}
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
              <Tooltip title="Edit priority">
                <IconButton
                  size="small"
                  onClick={(e) => setPriorityAnchor(e.currentTarget)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={priorityAnchor}
                open={Boolean(priorityAnchor)}
                onClose={() => setPriorityAnchor(null)}
              >
                <MenuItem
                  disabled={prioritySaving}
                  onClick={handleTogglePriority}
                >
                  {localStatus === "Standard"
                    ? "Set to Priority"
                    : "Set to Standard"}
                </MenuItem>
              </Menu>
              <Tooltip
                title={
                  isFlagged
                    ? "Clear safeguarding flag"
                    : "Flag for safeguarding"
                }
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={flagSaving}
                    onClick={handleToggleFlag}
                  >
                    <FlagIcon color={isFlagged ? "error" : "disabled"} />
                  </IconButton>
                </span>
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
                    value={String(caseItem.position)}
                    onChange={handlePositionChange}
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
                onClick={() => setConfirmSeenOpen(true)}
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
          <Button variant="contained" onClick={() => setConfirmNotesOpen(true)}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmChangeModal
        open={confirmNotesOpen}
        handleClose={() => setConfirmNotesOpen(false)}
        handleConfirm={handleSaveNotes}
      />

      <ConfirmChangeModal
        open={confirmSeenOpen}
        handleClose={() => setConfirmSeenOpen(true)}
        handleConfirm={() => {
          setConfirmSeenOpen(false);
          handleMarkSeen(caseItem.id);
        }}
      />
    </Card>
  );
};

export default CurrentQueueItem;
