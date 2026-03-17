import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { DEPARTMENTS, type DepartmentName } from "../../shared/formSchema";
import useCases, { type CaseStatus, type CaseSummary } from "../hooks/useCases";
import CaseItemCard from "../components/StaffComponents/CaseItemCard";

export const STATUS_OPTIONS: CaseStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export const STATUS_LABEL: Record<CaseStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

// This page displays a searchable and filterable list of current cases for staff users, allowing them to review case details and statuses. Each case is presented in a card format with key information and a link to view more details.
const StaffCaseManagementPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "">("");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentName | "">(
    "",
  );

  const { cases, loading, error } = useCases({
    status: statusFilter,
    departmentName: departmentFilter,
  });

  const filteredCases = useMemo(() => {
    if (!search) return cases;
    const q = search.toLowerCase();
    return cases.filter(
      (c) =>
        c.enquiry.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        c.referenceNumber.toLowerCase().includes(q) ||
        (c.title ?? "").toLowerCase().includes(q),
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
              setDepartmentFilter(e.target.value as DepartmentName | "")
            }
          >
            <MenuItem value="">All</MenuItem>
            {DEPARTMENTS.map((d) => (
              <MenuItem key={d.name} value={d.name}>
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
            <CaseItemCard caseItem={caseItem as CaseSummary} />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default StaffCaseManagementPage;
