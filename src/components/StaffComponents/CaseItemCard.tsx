import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import type {
  CaseStatus,
  CaseSummary,
  DepartmentName,
} from "../../hooks/useCases";
import { DepartmentLabelByName } from "../../../shared/formSchema";
import { useNavigate } from "react-router-dom";
import { STATUS_LABEL } from "../../pages/StaffCaseManagementPage";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import FlagIcon from "@mui/icons-material/Flag";

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
    DepartmentName,
    | "error"
    | "warning"
    | "info"
    | "secondary"
    | "success"
    | "primary"
    | "default"
  >
> = {
  Homelessness: "error",
  Council_Tax_Or_Housing_Benefit: "info",
  Adults_Duty: "secondary",
  Childrens_Duty: "success",
  Community_Hub_Advisor: "primary",
  General_Customer_Services: "default",
};

const CaseItemCard = ({ caseItem }: { caseItem: CaseSummary }) => {
  const navigate = useNavigate();
  return (
    <Card key={caseItem.id} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Box flex={1} minWidth={0}>
            <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
              <Chip
                label={DepartmentLabelByName[caseItem.departmentName]}
                color={DEPT_COLOR[caseItem.departmentName] ?? "default"}
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
                  label="Flagged"
                  color="warning"
                  size="small"
                />
              )}
            </Stack>

            <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
              {caseItem.title} #{caseItem.referenceNumber}
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

          <IconButton
            onClick={() => navigate(`./${caseItem.id}`)}
            aria-label={`View details for case ${caseItem.referenceNumber}`}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CaseItemCard;
