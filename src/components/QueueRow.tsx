import {
  TableRow,
  TableCell,
  Typography,
  Button,
  Box,
  Chip,
} from "@mui/material";

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
          <Button variant="outlined" size="small">
            Adjust
          </Button>
          <Button variant="outlined" size="small" color="error">
            Cases
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default QueueRow;
