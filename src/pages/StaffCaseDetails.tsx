import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ShieldIcon from "@mui/icons-material/Shield";
import SectionCard from "../components/StaffComponents/SectionCard";
import DetailRow from "../components/StaffComponents/DetailRow";
import useCaseDetails from "../hooks/useCaseDetails";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { UI_OPTIONS } from "../../shared/formSchema";

const CASE_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

const client = generateClient<Schema>({ authMode: "userPool" });

const StaffCaseDetails = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const { caseDetails: c, loading, error } = useCaseDetails(caseId);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [caseNameOpen, setCaseNameOpen] = useState(false);
  const [caseNameValue, setCaseNameValue] = useState("");
  const [savingCaseName, setSavingCaseName] = useState(false);

  const statusColorMap: Record<
    string,
    "success" | "warning" | "error" | "default"
  > = {
    OPEN: "success",
    IN_PROGRESS: "success",
    RESOLVED: "default",
    CLOSED: "warning",
  };

  const openNotesModal = () => {
    setNotesValue(c?.notes ?? "");
    setNotesOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!caseId) return;
    setSavingNotes(true);
    try {
      await client.models.Case.update({ id: caseId, notes: notesValue });
      setNotesOpen(false);
    } catch (error) {
      console.error("Failed to update case notes", error);
      window.alert("Unable to save notes. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };

  const openCaseNameModal = () => {
    setCaseNameValue(c?.caseName ?? "");
    setCaseNameOpen(true);
  };

  const handleSaveCaseName = async () => {
    if (!caseId) return;
    setSavingCaseName(true);
    try {
      await client.models.Case.update({ id: caseId, name: caseNameValue });
      setCaseNameOpen(false);
    } catch (error) {
      console.error("Failed to update case title", error);
      window.alert("Unable to save title. Please try again.");
    } finally {
      setSavingCaseName(false);
    }
  };

  const handleStatusChange = async (e: SelectChangeEvent) => {
    if (!caseId) return;
    setUpdatingStatus(true);
    try {
      await client.models.Case.update({
        id: caseId,
        status: e.target.value as (typeof CASE_STATUSES)[number],
      });
    } finally {
      setUpdatingStatus(false);
    }
  };
  const {
    ageRange: ageRangeLabels,
    disabilityType: disabilityTypeLabels,
    supportNeeds: supportNeedsLabels,
    urgentReason: urgentReasonLabels,
  } = UI_OPTIONS;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !c) {
    return (
      <Box sx={{ p: 4 }}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography color="error" mt={2}>
          {error ?? "Case not found."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          aria-label="Go back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Case Management
        </Typography>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
      >
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="h4" fontWeight={600}>
            {c?.caseName} #{c.referenceNumber} &middot; {c.departmentId}
          </Typography>
          <IconButton
            size="small"
            onClick={openCaseNameModal}
            sx={{ mt: 0.25 }}
            aria-label="Edit case title"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent="flex-end"
        >
          {c.priority && (
            <Chip
              icon={<PriorityHighIcon />}
              label="Priority"
              color="error"
              size="small"
            />
          )}
          {c.flag && (
            <Chip
              icon={<ShieldIcon />}
              label="Flagged"
              color="warning"
              size="small"
            />
          )}
          <FormControl size="small" disabled={updatingStatus}>
            <Select
              value={c.status ?? ""}
              onChange={handleStatusChange}
              sx={{ fontSize: "0.8125rem" }}
            >
              {CASE_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  <Chip
                    label={s.replace("_", " ")}
                    color={statusColorMap[s] ?? "default"}
                    size="small"
                    sx={{ pointerEvents: "none" }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Stack spacing={2}>
        {/* Case Overview */}
        <SectionCard title="Case Overview">
          <DetailRow label="Description" value={c.description} />
        </SectionCard>

        {/* Resident Details */}
        <SectionCard title="Resident Details">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 0 }}>
              <DetailRow label="Full Name" value={c.residentName} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 0 }}>
              <DetailRow
                label="Age Range"
                value={
                  ageRangeLabels.find((a) => a.value === c.ageRange)?.label
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow label="Household Size" value={c.householdSize} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow label="Number of Children" value={c.childrenCount} />
            </Grid>
            <Grid size={{ xs: 12, sm: 12 }}>
              <Stack spacing={2}>
                <DetailRow label="Safe to Contact" value={c.safeToContact} />
                {c.safeContactNotes && (
                  <DetailRow
                    label="Safe to Contact Notes"
                    value={c.safeContactNotes}
                  />
                )}
              </Stack>
            </Grid>
          </Grid>
        </SectionCard>

        {/* Enquiry */}
        <SectionCard title="Enquiry">
          <Stack spacing={2}>
            <DetailRow label="Details" value={c.enquiry} />
            {c.otherEnquiryText && (
              <DetailRow
                label="Other Enquiry Details"
                value={c.otherEnquiryText}
              />
            )}
          </Stack>
        </SectionCard>

        {/* Vulnerability & Support */}
        <SectionCard title="Vulnerability & Support Needs">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow
                label="Disability / Sensory Need"
                value={
                  c.hasDisabilityOrSensory
                    ? disabilityTypeLabels.find(
                        (d) => d.value === c.disabilityType,
                      )?.label
                    : "None reported"
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow
                label="Domestic Abuse"
                value={c.domesticAbuse ? "Yes" : "No"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12 }}>
              <DetailRow label="Support Notes" value={c.supportNotes} />
            </Grid>
            {c.supportNeeds.length > 0 && (
              <Grid size={{ xs: 12, sm: 12 }}>
                <DetailRow
                  label="Support Needs"
                  value={
                    <Stack
                      direction="row"
                      spacing={0.5}
                      flexWrap="wrap"
                      mt={0.25}
                    >
                      {c.supportNeeds.map((need) => (
                        <Chip
                          key={need}
                          label={
                            supportNeedsLabels.find((s) => s.value === need)
                              ?.label
                          }
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  }
                />
              </Grid>
            )}
            {c.otherSupport && (
              <Grid size={{ xs: 12, sm: 12 }}>
                <DetailRow label="Other Support" value={c.otherSupport} />
              </Grid>
            )}
          </Grid>
        </SectionCard>

        {/* Urgency */}
        {c.urgent === "yes" && (
          <SectionCard title="Urgency">
            <Stack spacing={2}>
              <DetailRow
                label="Urgent Reason"
                value={
                  urgentReasonLabels.find((u) => u.value === c.urgentReason)
                    ?.label
                }
              />
              {c.urgentReasonOtherText && (
                <DetailRow
                  label="Additional Urgency Details"
                  value={c.urgentReasonOtherText}
                />
              )}
            </Stack>
          </SectionCard>
        )}

        {/* Notes & Additional Info */}
        <SectionCard title="Notes & Additional Information">
          <Stack spacing={2}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Box flex={1}>
                <DetailRow label="Notes" value={c.notes ?? "No notes yet."} />
              </Box>
              <IconButton
                size="small"
                onClick={openNotesModal}
                sx={{ mt: 0.5 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Stack>
            {c.additionalInfo && (
              <DetailRow label="Additional Info" value={c.additionalInfo} />
            )}
          </Stack>
        </SectionCard>

        <Dialog
          open={caseNameOpen}
          onClose={() => setCaseNameOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Set Case Title</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              value={caseNameValue}
              onChange={(e) => setCaseNameValue(e.target.value.slice(0, 50))}
              slotProps={{ htmlInput: { maxLength: 50 } }}
              helperText={`${caseNameValue.length}/50`}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setCaseNameOpen(false)}
              disabled={savingCaseName}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveCaseName}
              disabled={savingCaseName}
            >
              {savingCaseName ? "Saving…" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Edit Notes</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              multiline
              rows={6}
              fullWidth
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNotesOpen(false)} disabled={savingNotes}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? "Saving…" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Tickets */}
        {c.tickets.length > 0 && (
          <SectionCard title="Linked Tickets">
            <Stack spacing={1}>
              {c.tickets.map((ticket) => (
                <Stack
                  key={ticket.ticketId}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ py: 0.5 }}
                >
                  <Typography variant="body2">
                    Ticket #{ticket.ticketId}
                  </Typography>
                  <Chip label={ticket.ticketStatus} size="small" />
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        )}
      </Stack>
    </Box>
  );
};

export default StaffCaseDetails;
