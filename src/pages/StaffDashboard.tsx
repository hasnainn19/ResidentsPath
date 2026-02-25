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
import React from "react";
import StatCard from "../components/StaffComponents/StatCard";
import QueueRow from "../components/StaffComponents/QueueRow";

// Main staff dashboard page, providing an overview of key metrics and current service queues. It utilizes the StatCard component to display important statistics and the QueueRow component to list active queues with their respective details and actions.
const StaffDashboard = () => {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  const lastUpdated = "2026-02-16 14:00";
  const stats = [
    {
      icon: GroupsIcon,
      value: 67,
      label: "Waiting in reception",
      change: 12,
      isPositive: true,
      lastUpdated,
    },
    {
      icon: ExitToAppIcon,
      value: 23,
      label: "Stepped Out",
      change: 8,
      isPositive: true,
      lastUpdated,
    },
    {
      icon: PriorityHighIcon,
      value: 13,
      label: "Urgent Cases",
      change: -2,
      isPositive: false,
      lastUpdated,
    },
    {
      icon: SupervisorAccountIcon,
      value: "2",
      label: "Available Staff",
      change: 5,
      isPositive: true,
      lastUpdated,
    },
    {
      icon: HourglassBottomIcon,
      value: "55m",
      label: "Longest Wait Time",
      change: 5,
      isPositive: true,
      lastUpdated,
    },
  ];

  const queues = [
    {
      service: "Benefits and financial support",
      waiting: 12,
      longestWaitTime: 15,
      priorityBreakdown: { Standard: 2, Priority: 5, Urgent: 5 },
      steppedOut: 3,
    },
    {
      service: "Births, deaths and ceremonies",
      waiting: 0,
      longestWaitTime: null,
      priorityBreakdown: { Standard: 0, Priority: 0, Urgent: 0 },
      steppedOut: 0,
    },
    {
      service: "Business and licensing",
      waiting: 5,
      longestWaitTime: 25,
      priorityBreakdown: { Standard: 3, Priority: 1, Urgent: 1 },
      steppedOut: 2,
    },
    {
      service: "Community hub and libraries",
      waiting: 18,
      longestWaitTime: 10,
      priorityBreakdown: { Standard: 5, Priority: 8, Urgent: 5 },
      steppedOut: 4,
    },
    {
      service: "Community safety and support",
      waiting: 7,
      longestWaitTime: 8,
      priorityBreakdown: { Standard: 1, Priority: 3, Urgent: 3 },
      steppedOut: 1,
    },
    {
      service: "Council and elections",
      waiting: 0,
      longestWaitTime: null,
      priorityBreakdown: { Standard: 0, Priority: 0, Urgent: 0 },
      steppedOut: 0,
    },
    {
      service: "Council Tax",
      waiting: 14,
      longestWaitTime: 20,
      priorityBreakdown: { Standard: 4, Priority: 6, Urgent: 4 },
      steppedOut: 2,
    },
    {
      service: "Environment",
      waiting: 3,
      longestWaitTime: 5,
      priorityBreakdown: { Standard: 2, Priority: 1, Urgent: 0 },
      steppedOut: 1,
    },
    {
      service: "Housing",
      waiting: 9,
      longestWaitTime: 12,
      priorityBreakdown: { Standard: 2, Priority: 4, Urgent: 3 },
      steppedOut: 2,
    },
    {
      service: "Jobs, careers and adult education",
      waiting: 0,
      longestWaitTime: null,
      priorityBreakdown: { Standard: 0, Priority: 0, Urgent: 0 },
      steppedOut: 0,
    },
    {
      service: "Leisure, parks and sports",
      waiting: 4,
      longestWaitTime: 6,
      priorityBreakdown: { Standard: 3, Priority: 1, Urgent: 0 },
      steppedOut: 1,
    },
    {
      service: "Parking, transport and streets",
      waiting: 11,
      longestWaitTime: 18,
      priorityBreakdown: { Standard: 5, Priority: 4, Urgent: 2 },
      steppedOut: 3,
    },
    {
      service: "Planning and building",
      waiting: 6,
      longestWaitTime: 14,
      priorityBreakdown: { Standard: 2, Priority: 2, Urgent: 2 },
      steppedOut: 1,
    },
    {
      service: "Schools, nurseries and education",
      waiting: 2,
      longestWaitTime: 3,
      priorityBreakdown: { Standard: 1, Priority: 1, Urgent: 0 },
      steppedOut: 0,
    },
    {
      service: "Social care and health",
      waiting: 16,
      longestWaitTime: 22,
      priorityBreakdown: { Standard: 3, Priority: 6, Urgent: 7 },
      steppedOut: 4,
    },
    {
      service: "Waste and recycling",
      waiting: 0,
      longestWaitTime: null,
      priorityBreakdown: { Standard: 0, Priority: 0, Urgent: 0 },
      steppedOut: 0,
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
        sx={(theme) => ({
          width: "100%",
          maxWidth: { sm: "100%", md: "100%" },
          p: 3,
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        })}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ mb: 3, color: (theme) => theme.palette.primary.main }}
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
          sx={{ mb: 3, color: (theme) => theme.palette.primary.main }}
        >
          Current Queues
        </Typography>
        <TableContainer
          component={Paper}
          sx={{ backgroundColor: (theme) => theme.palette.background.paper }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSort("service")}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontWeight: sortColumn === "service" ? "bold" : "normal",
                    color:
                      sortColumn === "service"
                        ? (theme: any) => theme.palette.primary.main
                        : "inherit",
                  }}
                >
                  Service
                </TableCell>
                <TableCell
                  onClick={() => handleSort("waiting")}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontWeight: sortColumn === "waiting" ? "bold" : "normal",
                    color:
                      sortColumn === "waiting"
                        ? (theme: any) => theme.palette.primary.main
                        : "inherit",
                  }}
                >
                  Waiting
                </TableCell>
                <TableCell
                  onClick={() => handleSort("longestWaitTime")}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontWeight:
                      sortColumn === "longestWaitTime" ? "bold" : "normal",
                    color:
                      sortColumn === "longestWaitTime"
                        ? (theme: any) => theme.palette.primary.main
                        : "inherit",
                  }}
                >
                  Longest Wait
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Priority</TableCell>
                <TableCell
                  onClick={() => handleSort("steppedOut")}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    fontWeight: sortColumn === "steppedOut" ? "bold" : "normal",
                    color:
                      sortColumn === "steppedOut"
                        ? (theme: any) => theme.palette.primary.main
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
                <QueueRow availableStaff={0} key={queue.service} {...queue} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default StaffDashboard;
