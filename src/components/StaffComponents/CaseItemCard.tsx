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
  DepartmentId,
} from "../../hooks/useCases";
import { DepartmentLabelById } from "../../../shared/formSchema";
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

const CaseItemCard = ({ caseItem }: { caseItem: CaseSummary }) => {
  const navigate = useNavigate();
  return (
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
