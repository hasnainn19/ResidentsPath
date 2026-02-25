import {
  TableRow,
  TableCell,
  Typography,
  Button,
  Box,
  Chip,
} from "@mui/material";
import ServiceQueueModal from "./ServiceQueueModal";
import React from "react";
import { useNavigate } from "react-router";

type PriorityBreakdown = {
  Standard: number;
  Priority: number;
  Urgent: number;
};

interface QueueRowProps {
  service: string;
  waiting: number;
  longestWaitTime: number | null;
  priorityBreakdown: PriorityBreakdown;
  steppedOut: number;
  availableStaff: number;
}
// This component represents a single row in the service queue table on the staff dashboard, displaying key metrics and actions for each service.
const QueueRow = ({
  service,
  waiting,
  longestWaitTime,
  priorityBreakdown,
  steppedOut,
  availableStaff,
}: QueueRowProps) => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const handleOpen = () => setModalOpen(true);
  const handleClose = () => setModalOpen(false);
  const navigate = useNavigate();
  return (
    <TableRow hover>
      <TableCell>
        <Typography fontWeight={500}>{service}</Typography>
      </TableCell>

      <TableCell>{waiting}</TableCell>

      <TableCell>
        {longestWaitTime ? `${longestWaitTime} mins` : "--"}
      </TableCell>

      <TableCell>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label={`Urgent: ${priorityBreakdown.Urgent}`}
            size="small"
            color="error"
            sx={{
              fontWeight: "bold",
              bgcolor: (theme) => theme.palette.error.light,
            }}
          />
          <Chip
            label={`Priority: ${priorityBreakdown.Priority}`}
            size="small"
            color="success"
            sx={{
              fontWeight: "bold",
              bgcolor: (theme) => theme.palette.success.light,
            }}
          />
          <Chip
            label={`Standard: ${priorityBreakdown.Standard}`}
            size="small"
            color="warning"
            sx={{
              fontWeight: "bold",
              bgcolor: (theme) => theme.palette.warning.light,
            }}
          />
        </Box>
      </TableCell>

      <TableCell>{steppedOut}</TableCell>

      <TableCell>{availableStaff}</TableCell>

      <TableCell>
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* <Button variant="outlined" size="small" onClick={handleOpen}>
            Adjust
          </Button> */}
          <Button variant="outlined" size="small">
            Adjust
          </Button>
          <ServiceQueueModal
            serviceName={service}
            open={modalOpen}
            handleClose={handleClose}
          />
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => navigate(`/staff/`)}
          >
            Cases
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default QueueRow;
