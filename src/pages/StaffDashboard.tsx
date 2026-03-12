import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  Groups as GroupsIcon,
  ExitToApp as ExitToAppIcon,
  PriorityHigh as PriorityHighIcon,
  SupervisorAccount as SupervisorAccountIcon,
  HourglassBottom as HourglassBottomIcon,
} from "@mui/icons-material";
import StatCard from "../components/StaffComponents/StatCard";
import QueueRow from "../components/StaffComponents/QueueRow";
import useDashboardStats from "../hooks/useDashboardStats";
import useServiceStats from "../hooks/useServiceStats";
import { useState } from "react";

// Main staff dashboard page, providing an overview of key metrics and current service queues. It utilizes the StatCard component to display important statistics and the QueueRow component to list active queues with their respective details and actions.
const StaffDashboard = () => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const dashboardStats = useDashboardStats();
  const queues = useServiceStats();

  const stats = [
    {
      icon: GroupsIcon,
      value: dashboardStats.waitingCount,
      label: "Waiting in reception",
    },
    {
      icon: ExitToAppIcon,
      value: dashboardStats.steppedOutCount,
      label: "Stepped Out",
    },
    {
      icon: PriorityHighIcon,
      value: dashboardStats.priorityCount,
      label: "Urgent Cases",
    },
    {
      icon: SupervisorAccountIcon,
      value: dashboardStats.staffCount,
      label: "Available Staff",
    },
    {
      icon: HourglassBottomIcon,
      value:
        dashboardStats.longestWaitTime != null
          ? `${dashboardStats.longestWaitTime} mins`
          : "N/A",
      label: "Longest Wait Time",
    },
  ];

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const getSortedQueues = () => {
    if (!sortColumn) return queues;

    const sorted = [...queues].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof typeof a];
      let bValue: any = b[sortColumn as keyof typeof b];

      // Parse numeric values from strings or handle null
      if (aValue === null) aValue = Infinity;
      if (bValue === null) bValue = Infinity;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortOrder === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    return sorted;
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          maxWidth: { sm: "100%", md: "100%" },
          p: 3,
          backgroundColor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ mb: 3, color: "primary.main" }}
        >
          Overview
        </Typography>
        <Grid container spacing={2} columns={15} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ mb: 3, color: "primary.main" }}
        >
          Current Queues
        </Typography>
        <TableContainer
          component={Paper}
          sx={{ backgroundColor: "background.paper" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSort("departmentName")}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    backgroundColor:
                      sortColumn === "departmentName"
                        ? "secondary.main"
                        : "inherit",
                    fontWeight:
                      sortColumn === "departmentName" ? "bold" : "normal",
                    color:
                      sortColumn === "departmentName"
                        ? "primary.main"
                        : "inherit",
                  }}
                >
                  Service
                </TableCell>
                <TableCell
                  onClick={() => handleSort("waitingCount")}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    backgroundColor:
                      sortColumn === "waitingCount"
                        ? "secondary.main"
                        : "inherit",
                    fontWeight:
                      sortColumn === "waitingCount" ? "bold" : "normal",
                    color:
                      sortColumn === "waitingCount"
                        ? "primary.main"
                        : "inherit",
                  }}
                >
                  Waiting
                </TableCell>
                <TableCell
                  onClick={() => handleSort("longestWait")}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    backgroundColor:
                      sortColumn === "longestWait"
                        ? "secondary.main"
                        : "inherit",
                    fontWeight:
                      sortColumn === "longestWait" ? "bold" : "normal",
                    color:
                      sortColumn === "longestWait" ? "primary.main" : "inherit",
                  }}
                >
                  Longest Wait
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Priority</TableCell>
                <TableCell
                  onClick={() => handleSort("steppedOutCount")}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    backgroundColor:
                      sortColumn === "steppedOutCount"
                        ? "secondary.main"
                        : "inherit",
                    fontWeight:
                      sortColumn === "steppedOutCount" ? "bold" : "normal",
                    color:
                      sortColumn === "steppedOutCount"
                        ? "primary.main"
                        : "inherit",
                  }}
                >
                  Stepped Out
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  Available Staff
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {getSortedQueues().map((queue) => (
                <QueueRow key={queue.departmentName} {...queue} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default StaffDashboard;
