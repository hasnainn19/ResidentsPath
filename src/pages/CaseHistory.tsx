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
  Button,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type CaseStatus = "Priority" | "Standard";
type CaseCategory =
  | "Housing"
  | "Financial Support"
  | "Licensing"
  | "Council Tax";

interface CaseItem {
  id: string;
  title: string;
  description: string;
  category: CaseCategory;
  status: CaseStatus;
}

const mockCases: CaseItem[] = [
  {
    id: "CS-2024-001",
    category: "Housing",
    status: "Priority",
    title: "Tenancy Dispute: 14B High Street",
    description:
      "Tenant reports severe mold infestation in the primary bedroom and bathroom, alleging landlord negligence over a 6-month period.\n\nThe initial inspection by Environmental Health confirms Category 1 hazard. Landlord has been unresponsive to 3 separate notices.",
  },
  {
    id: "CS-2024-002",
    category: "Financial Support",
    status: "Priority",
    title: "Emergency Grant Application: Thompson Family",
    description:
      "Application for emergency crisis fund due to redundancy and unexpected medical bills.\n\nApplicant has zero savings and faces utility disconnection. Universal Credit pending.",
  },
  {
    id: "CS-2024-003",
    category: "Licensing",
    status: "Standard",
    title: "License Renewal: The Golden Lion Pub",
    description:
      "Standard renewal application for premises license. No noise complaints recorded in the last 12 months.\n\nPolice and Fire Service have no objections.",
  },
  {
    id: "CS-2024-004",
    category: "Council Tax",
    status: "Standard",
    title: "Council Tax Arrears: Account #882910",
    description:
      "Resident has accumulated arrears of £1,200 over the 2025/2026 tax year.\n\nCorrespondence returned 'Addressee Gone Away' for the last 3 months.",
  },
];

const categoryColorMap: Record<
  CaseCategory,
  "warning" | "success" | "info" | "secondary"
> = {
  Housing: "warning",
  "Financial Support": "success",
  Licensing: "info",
  "Council Tax": "secondary",
};

const statusColorMap: Record<CaseStatus, "error" | "default"> = {
  Priority: "error",
  Standard: "default",
};

// This page displays a searchable and filterable list of past cases for staff users, allowing them to review case details and statuses. Each case is presented in a card format with key information and a link to view more details.
const CaseHistory = () => {
  const [search, setSearch] = useState("");

  const filteredCases = useMemo(() => {
    return mockCases.filter(
      (c) =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Case History
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

        <Button variant="outlined" startIcon={<FilterListIcon />}>
          Filter
        </Button>

        <Button variant="outlined" startIcon={<SortIcon />}>
          Sort
        </Button>
      </Stack>

      <Stack spacing={2}>
        {filteredCases.map((caseItem) => (
          <Card key={caseItem.id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Stack direction="row" spacing={1} mb={1}>
                    <Chip
                      label={caseItem.category}
                      color={categoryColorMap[caseItem.category]}
                      size="small"
                    />
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
                      overflowY: "auto",
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

                <IconButton>
                  <ChevronRightIcon />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default CaseHistory;
