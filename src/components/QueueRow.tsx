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
  Low: number;
  Medium: number;
  High: number;
};

interface QueueRowProps {
  service: string;
  waiting: number;
  longestWaitTime: string;
  priorityBreakdown: PriorityBreakdown;
  steppedOut: number;
  availableStaff: number;
}

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

      <TableCell>{longestWaitTime}</TableCell>

      <TableCell>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label={`Urgent: ${priorityBreakdown.High}`}
            size="small"
            color="error"
          />
          <Chip
            label={`Priority: ${priorityBreakdown.Medium}`}
            size="small"
            color="warning"
          />
          <Chip
            label={`Standard: ${priorityBreakdown.Low}`}
            size="small"
            color="success"
          />
        </Box>
      </TableCell>

      <TableCell>{steppedOut}</TableCell>

      <TableCell>{availableStaff}</TableCell>

      <TableCell>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleOpen}>
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
            onClick={() => navigate(`/staff/cases/`)}
          >
            Cases
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default QueueRow;
