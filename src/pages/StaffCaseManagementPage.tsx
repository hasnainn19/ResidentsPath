import React, { useMemo, useState } from "react";
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import FlagIcon from "@mui/icons-material/Flag";
import { useNavigate } from "react-router-dom";
import {
  DEPARTMENTS,
  DepartmentLabelById,
  type DepartmentId,
} from "../../shared/formSchema";
import useCases, { type CaseStatus } from "../hooks/useCases";

const STATUS_OPTIONS: CaseStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const STATUS_LABEL: Record<CaseStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_COLOR: Record<
  CaseStatus,
  "success" | "warning" | "error" | "default"
> = {
  OPEN: "success",
  IN_PROGRESS: "success",
  RESOLVED: "default",
  CLOSED: "warning",
};

const DEPT_COLOR: Partial<
  Record<
    DepartmentId,
    | "error"
    | "warning"
    | "info"
    | "secondary"
    | "success"
    | "primary"
    | "default"
  >
> = {
  HOMELESSNESS: "error",
  COUNCIL_TAX_OR_HOUSING_BENEFIT_HELP: "info",
  ADULTS_DUTY: "secondary",
  CHILDRENS_DUTY: "success",
  COMMUNITY_HUB_ADVISOR: "primary",
  GENERAL_CUSTOMER_SERVICES: "default",
};

// This page displays a searchable and filterable list of current cases for staff users, allowing them to review case details and statuses. Each case is presented in a card format with key information and a link to view more details.
const StaffCaseManagementPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "">("");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentId | "">(
    "",
  );
  const navigate = useNavigate();

  const { cases, loading, error } = useCases({
    status: statusFilter,
    departmentId: departmentFilter,
  });

  const filteredCases = useMemo(() => {
    if (!search) return cases;
    const q = search.toLowerCase();
    return cases.filter(
      (c) =>
        c.enquiry.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        c.referenceNumber.toLowerCase().includes(q),
    );
  }, [cases, search]);

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Case Management
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
        <TextField
          fullWidth
          placeholder="Search cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CaseStatus | "")}
          >
            <MenuItem value="">All</MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Department</InputLabel>
          <Select
            label="Department"
            value={departmentFilter}
            onChange={(e) =>
              setDepartmentFilter(e.target.value as DepartmentId | "")
            }
          >
            <MenuItem value="">All</MenuItem>
            {DEPARTMENTS.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {filteredCases.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No cases found.
            </Typography>
          )}

          {filteredCases.map((caseItem) => (
            <Card key={caseItem.id} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Box flex={1} minWidth={0}>
                    <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
                      <Chip
                        label={DepartmentLabelById[caseItem.departmentId]}
                        color={DEPT_COLOR[caseItem.departmentId] ?? "default"}
                        size="small"
                      />
                      {caseItem.status && (
                        <Chip
                          label={STATUS_LABEL[caseItem.status]}
                          color={STATUS_COLOR[caseItem.status]}
                          size="small"
                        />
                      )}
                      {caseItem.priority && (
                        <Chip
                          icon={<PriorityHighIcon />}
                          label="Priority"
                          color="error"
                          size="small"
                        />
                      )}
                      {caseItem.flag && (
                        <Chip
                          icon={<FlagIcon />}
                          label="Safeguarding"
                          color="warning"
                          size="small"
                        />
                      )}
                    </Stack>

                    <Typography
                      variant="h6"
                      fontWeight={600}
                      gutterBottom
                      noWrap
                    >
                      #{caseItem.referenceNumber}
                    </Typography>

                    <Divider sx={{ mb: 1 }} />

                    <Box sx={{ maxHeight: 120, overflowY: "auto", pr: 1 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {caseItem.description ?? "No description provided."}
                      </Typography>
                    </Box>
                  </Box>

                  <IconButton onClick={() => navigate(`./${caseItem.id}`)}>
                    <ChevronRightIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default StaffCaseManagementPage;
