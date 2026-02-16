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

import StatCard from "../components/StatCard";
import QueueRow from "../components/QueueRow";

// Main staff dashboard page, providing an overview of key metrics and current service queues. It utilizes the StatCard component to display important statistics and the QueueRow component to list active queues with their respective details and actions.
const StaffDashboard = () => {
  const lastUpdated = "2026-02-16 14:00";
  const stats = [
    {
      icon: GroupsIcon,
      value: 67,
      label: "Waiting in reception",
      change: "+12%",
      isPositive: true,
      lastUpdated,
    },
    {
      icon: ExitToAppIcon,
      value: 23,
      label: "Stepped Out",
      change: "+8%",
      isPositive: true,
      lastUpdated,
    },
    {
      icon: PriorityHighIcon,
      value: 13,
      label: "Urgent Cases",
      change: "-2%",
      isPositive: false,
      lastUpdated,
    },
    {
      icon: SupervisorAccountIcon,
      value: "2",
      label: "Available Staff",
      change: "+5%",
      isPositive: true,
      lastUpdated,
    },
    {
      icon: HourglassBottomIcon,
      value: "55m",
      label: "Longest Wait Time",
      change: "+5%",
      isPositive: true,
      lastUpdated,
    },
  ];

  const queues = [
    {
      service: "Benefits and financial support",
      waiting: 12,
      longestWaitTime: "15 mins",
      priorityBreakdown: { Low: 2, Medium: 5, High: 5 },
      steppedOut: 3,
    },
    {
      service: "Births, deaths and ceremonies",
      waiting: 8,
      longestWaitTime: "5 mins",
      priorityBreakdown: { Low: 1, Medium: 3, High: 4 },
      steppedOut: 1,
    },
    {
      service: "Business and licensing",
      waiting: 5,
      longestWaitTime: "25 mins",
      priorityBreakdown: { Low: 3, Medium: 1, High: 1 },
      steppedOut: 2,
    },
    {
      service: "Community hub and libraries",
      waiting: 18,
      longestWaitTime: "10 mins",
      priorityBreakdown: { Low: 5, Medium: 8, High: 5 },
      steppedOut: 4,
    },
    {
      service: "Community hub and libraries",
      waiting: 18,
      longestWaitTime: "10 mins",
      priorityBreakdown: { Low: 2, Medium: 4, High: 2 },
      steppedOut: 4,
    },
    {
      service: "Community hub and libraries",
      waiting: 18,
      longestWaitTime: "10 mins",
      priorityBreakdown: { Low: 1, Medium: 2, High: 1 },
      steppedOut: 4,
    },
  ];

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
                <TableCell>Service</TableCell>
                <TableCell>Waiting</TableCell>
                <TableCell>Longest Wait</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Stepped Out</TableCell>
                <TableCell>Available Staff</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {queues.map((queue) => (
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
