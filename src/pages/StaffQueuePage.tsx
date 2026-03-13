import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Typography,
  TextField,
  InputAdornment,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import ConfirmChangeModal from "../components/StaffComponents/ConfirmChangeModal";
import CurrentQueueItem from "../components/StaffComponents/CurrentQueueItem";
import useQueueItems from "../hooks/useQueueItems";

type CaseStatus = "Priority" | "Standard";

interface CaseItem {
  id: string; // ticket UUID — used as the React key and passed to adjustQueuePosition
  ticketNumber: string;
  department: string;
  title: string;
  description: string;
  status: CaseStatus;
  position: number;
  notes: string | null;
}

const client = generateClient<Schema>({ authMode: "userPool" });

const StaffQueuePage = () => {
  const [searchParams] = useSearchParams();
  const selectedDepartmentName = searchParams.get("departmentName")?.trim() || "";

  const { items, loading } = useQueueItems(selectedDepartmentName);

  const cases: CaseItem[] = items.map((item) => ({
    id: item.ticketId,
    ticketNumber: item.ticketNumber,
    department: item.department,
    title: item.title,
    description: item.description,
    status: item.priority ? "Priority" : "Standard",
    position: item.position,
    notes: item.notes,
  }));

  const [search, setSearch] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingPositionChange, setPendingPositionChange] = useState<{
    caseId: string;
    position: number;
  } | null>(null);

  // Only show the position selector when viewing a specific department's queue
  const showPosition = !!selectedDepartmentName;

  const filteredCases = useMemo(() => {
    return cases
      .filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => a.position - b.position);
  }, [search, cases]);

  const queueTitle = selectedDepartmentName
    ? selectedDepartmentName.replace(/_/g, " ")
    : "Case Management";

  const handleMarkSeen = async (caseId: string) => {
    try {
      await client.mutations.markTicketSeen({ ticketId: caseId });
    } catch (e) {
      console.error("StaffQueuePage: markTicketSeen failed", e);
    }
  };

  const handleSelectPosition = (caseId: string, newPosition: number) => {
    setPendingPositionChange({ caseId, position: newPosition });
    setConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
    setPendingPositionChange(null);
  };

  const handleConfirmPositionChange = async () => {
    if (!pendingPositionChange) {
      setConfirmModalOpen(false);
      return;
    }

    const { caseId, position } = pendingPositionChange;
    setConfirmModalOpen(false);
    setPendingPositionChange(null);

    try {
      await client.mutations.adjustQueuePosition({
        ticketId: caseId,
        newPosition: position,
      });
    } catch (e) {
      console.error("StaffQueuePage: adjustQueuePosition failed", e);
    }
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
        {queueTitle}
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

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : filteredCases.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Queue is empty
        </Typography>
      ) : (
        <Stack spacing={2}>
          {filteredCases.map((caseItem) => (
            <CurrentQueueItem
              key={caseItem.id}
              caseItem={caseItem}
              totalPositions={cases.length}
              handleSelectPosition={handleSelectPosition}
              handleMarkSeen={handleMarkSeen}
              showPosition={showPosition}
            />
          ))}
        </Stack>
      )}

      <ConfirmChangeModal
        open={confirmModalOpen}
        handleClose={handleCloseConfirmModal}
        handleConfirm={handleConfirmPositionChange}
      />
    </Box>
  );
};

export default StaffQueuePage;
