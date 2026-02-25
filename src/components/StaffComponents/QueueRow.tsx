import {
  TableRow,
  TableCell,
  Typography,
  Button,
  Box,
  Chip,
} from "@mui/material";

type PriorityBreakdown = {
  Standard: number;
  Priority: number;
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
            label={`Priority: ${priorityBreakdown.Priority}`}
            size="small"
            color="error"
            sx={{
              fontWeight: "bold",
              bgcolor: "error.light",
            }}
          />
          <Chip
            label={`Standard: ${priorityBreakdown.Standard}`}
            size="small"
            color="warning"
            sx={{
              fontWeight: "bold",
              bgcolor: "warning.light",
            }}
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
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default QueueRow;
