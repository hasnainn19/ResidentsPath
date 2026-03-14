import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ConfirmChangeModal from "../components/StaffComponents/ConfirmChangeModal";
import CurrentQueueItem from "../components/StaffComponents/CurrentQueueItem";
import { useTranslation } from 'react-i18next';

type CaseStatus = "Priority" | "Standard";

interface CaseItem {
  id: string;
  service: string;
  title: string;
  description: string;
  status: CaseStatus;
  position: number;
}

const mockCases: CaseItem[] = [
  {
    id: "CS-2024-001",
    service: "Housing",
    status: "Priority",
    position: 1,
    title: "Tenancy Dispute: 14B High Street",
    description:
      "Tenant reports severe mold infestation in the primary bedroom and bathroom, alleging landlord negligence over a 6-month period.\n\nThe initial inspection by Environmental Health confirms Category 1 hazard. Landlord has been unresponsive to 3 separate notices.",
  },
  {
    id: "CS-2024-002",
    service: "Benefits and financial support",
    status: "Priority",
    position: 1,
    title: "Emergency Grant Application: Thompson Family",
    description:
      "Application for emergency crisis fund due to redundancy and unexpected medical bills.\n\nApplicant has zero savings and faces utility disconnection. Universal Credit pending.",
  },
  {
    id: "CS-2024-003",
    service: "Business and licensing",
    status: "Standard",
    position: 1,
    title: "License Renewal: The Golden Lion Pub",
    description:
      "Standard renewal application for premises license. No noise complaints recorded in the last 12 months.\n\nPolice and Fire Service have no objections.",
  },
  {
    id: "CS-2024-004",
    service: "Council Tax",
    status: "Standard",
    position: 1,
    title: "Council Tax Arrears: Account #882910",
    description:
      "Resident has accumulated arrears of £1,200 over the 2025/2026 tax year.\n\nCorrespondence returned 'Addressee Gone Away' for the last 3 months.",
  },
];

// This page displays a searchable and filterable list of past cases for staff users, allowing them to review case details and statuses. Each case is presented in a card format with key information and a link to view more details.

const validDepartments = [...new Set(mockCases.map((c) => c.service))];

const StaffQueuePage = () => {
  const [searchParams] = useSearchParams();
  const selectedService = searchParams.get("service")?.trim() || "";
  const isValidDepartment = !!selectedService && validDepartments.includes(selectedService);
  const showPosition = isValidDepartment;
  const {  t: translate } = useTranslation();
  const [search, setSearch] = useState("");
  const [cases, setCases] = useState<CaseItem[]>(mockCases);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingPositionChange, setPendingPositionChange] = useState<{
    caseId: string;
    position: number;
  } | null>(null);


  const serviceCases = useMemo(() => {
    return cases.filter(
      (c) => !isValidDepartment || c.service === selectedService,
    );
  }, [cases, selectedService, isValidDepartment]);

  const filteredCases = useMemo(() => {
    return serviceCases
      .filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => a.position - b.position);
  }, [search, serviceCases]);

  const serviceCaseCountMap = useMemo(() => {
    return cases.reduce<Record<string, number>>((acc, caseItem) => {
      acc[caseItem.service] = (acc[caseItem.service] ?? 0) + 1;
      return acc;
    }, {});
  }, [cases]);

  const queueTitle = selectedService || "Case Management";

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

    const targetCase = cases.find(
      (caseItem) => caseItem.id === pendingPositionChange.caseId,
    );
    if (!targetCase) {
      setConfirmModalOpen(false);
      setPendingPositionChange(null);
      return;
    }
    const maxPositionForService = serviceCaseCountMap[targetCase.service] ?? 1;
    const nextPosition = Math.min(
      Math.max(1, pendingPositionChange.position),
      maxPositionForService,
    );

    setCases((prev) =>
      prev.map((caseItem) =>
        caseItem.id === pendingPositionChange.caseId
          ? { ...caseItem, position: nextPosition }
          : caseItem,
      ),
    );
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

      {filteredCases.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Queue is empty
        </Typography>
      ) : (
        <Stack spacing={2}>
          {filteredCases.map((caseItem) => (
            <CurrentQueueItem
              key={caseItem.id}
              caseItem={caseItem}
              totalPositions={serviceCaseCountMap[caseItem.service] ?? 1}
              handleSelectPosition={handleSelectPosition}
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
