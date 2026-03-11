import {
  TableRow,
  TableCell,
  Typography,
  Button,
  Box,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

interface QueueRowProps {
  serviceName: string;
  waitingCount: number;
  longestWait: number;
  priorityCaseCount: number;
  standardCaseCount: number;
  steppedOutCount: number;
  availableStaff: number;
}
// This component represents a single row in the service queue table on the staff dashboard, displaying key metrics and actions for each service.
const QueueRow = ({
  serviceName,
  waitingCount,
  longestWait,
  priorityCaseCount,
  standardCaseCount,
  steppedOutCount,
  availableStaff,
}: QueueRowProps) => {
  const navigate = useNavigate();

  const handleAdjustClick = () => {
    const params = new URLSearchParams({ serviceName });
    navigate(`/staff/queues?${params.toString()}`);
  };

  return (
    <TableRow hover>
      <TableCell>
        <Typography fontWeight={500}>{serviceName}</Typography>
      </TableCell>

      <TableCell>{waitingCount}</TableCell>

      <TableCell>
        {longestWait == null ? "--" : `${longestWait} mins`}
      </TableCell>

      <TableCell>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label={`Priority: ${priorityCaseCount}`}
            size="small"
            color="error"
            sx={{
              fontWeight: "bold",
              bgcolor: "error.light",
            }}
          />
          <Chip
            label={`Standard: ${standardCaseCount}`}
            size="small"
            color="warning"
            sx={{
              fontWeight: "bold",
              bgcolor: "warning.light",
            }}
          />
        </Box>
      </TableCell>

      <TableCell>{steppedOutCount}</TableCell>

      <TableCell>{availableStaff}</TableCell>

      <TableCell>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" size="small" onClick={handleAdjustClick}>
            Adjust
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default QueueRow;
