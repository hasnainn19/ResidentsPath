import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ConfirmChangeModal from "../components/StaffComponents/ConfirmChangeModal";

type CaseStatus = "Priority" | "Standard";

interface CaseItem {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
}

const mockCases: CaseItem[] = [
  {
    id: "CS-2024-001",
    status: "Priority",
    title: "Tenancy Dispute: 14B High Street",
    description:
      "Tenant reports severe mold infestation in the primary bedroom and bathroom, alleging landlord negligence over a 6-month period.\n\nThe initial inspection by Environmental Health confirms Category 1 hazard. Landlord has been unresponsive to 3 separate notices.",
  },
  {
    id: "CS-2024-002",
    status: "Priority",
    title: "Emergency Grant Application: Thompson Family",
    description:
      "Application for emergency crisis fund due to redundancy and unexpected medical bills.\n\nApplicant has zero savings and faces utility disconnection. Universal Credit pending.",
  },
  {
    id: "CS-2024-003",
    status: "Standard",
    title: "License Renewal: The Golden Lion Pub",
    description:
      "Standard renewal application for premises license. No noise complaints recorded in the last 12 months.\n\nPolice and Fire Service have no objections.",
  },
  {
    id: "CS-2024-004",
    status: "Standard",
    title: "Council Tax Arrears: Account #882910",
    description:
      "Resident has accumulated arrears of £1,200 over the 2025/2026 tax year.\n\nCorrespondence returned 'Addressee Gone Away' for the last 3 months.",
  },
];

const statusColorMap: Record<CaseStatus, "error" | "default"> = {
  Priority: "error",
  Standard: "default",
};

// This page displays a searchable and filterable list of past cases for staff users, allowing them to review case details and statuses. Each case is presented in a card format with key information and a link to view more details.
const StaffQueuePage = () => {
  const [search, setSearch] = useState("");
  const [casePositions, setCasePositions] = useState<Record<string, number>>(
    () =>
      Object.fromEntries(
        mockCases.map((caseItem, index) => [caseItem.id, index + 1]),
      ),
  );
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingPositionChange, setPendingPositionChange] = useState<{
    caseId: string;
    position: number;
  } | null>(null);

  const filteredCases = useMemo(() => {
    return mockCases.filter(
      (c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  const positionOptions = Array.from(
    { length: filteredCases.length },
    (_, index) => index + 1,
  );

  const handleSelectPosition = (caseId: string, newPosition: number) => {
    setPendingPositionChange({ caseId, position: newPosition });
    setConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setPendingPositionChange(null);
  };

  const handleConfirmPositionChange = () => {
    if (!pendingPositionChange) {
      setConfirmModalOpen(false);
      return;
    }

    setCasePositions((prev) => ({
      ...prev,
      [pendingPositionChange.caseId]: pendingPositionChange.position,
    }));
    setConfirmModalOpen(false);
    setPendingPositionChange(null);
    window.location.reload();
  };

  return (
    <Box
      sx={{
        p: 4,
        maxWidth: 1000,
        mx: "auto",
        height: "100vh",
        overflowY: "auto",
        scrollbarGutter: "stable",
      }}
    >
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Current Queue
      </Typography>

      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          fullWidth
          placeholder="Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Stack spacing={2}>
        {filteredCases.map((caseItem) => (
          <Card key={caseItem.id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Box>
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
                      maxHeight: 120,
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

                <Stack spacing={1} alignItems="flex-end">
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id={`move-position-label-${caseItem.id}`}>
                      Move to position
                    </InputLabel>
                    <Select
                      labelId={`move-position-label-${caseItem.id}`}
                      label="Move to position"
                      value={String(
                        Math.min(
                          casePositions[caseItem.id] ?? 1,
                          filteredCases.length,
                        ),
                      )}
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

                  <IconButton>
                    <ChevronRightIcon />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <ConfirmChangeModal
        open={confirmModalOpen}
        handleClose={handleCloseConfirmModal}
        handleConfirm={handleConfirmPositionChange}
      />
    </Box>
  );
};

export default StaffQueuePage;
