import StaffNavbar from "../components/StaffNavbar";
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
  People as PeopleIcon,
  HowToReg as HowToRegIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingUp,
} from "@mui/icons-material";

import StatCard from "../components/StatCard";
import QueueRow from "../components/QueueRow";

const StaffDashboard = () => {
  const stats = [
    {
      icon: PeopleIcon,
      value: 67,
      label: "Waiting in reception",
      change: "+12%",
      isPositive: true,
    },
    {
      icon: HowToRegIcon,
      value: 23,
      label: "Stepped Out",
      change: "+8%",
      isPositive: true,
    },
    {
      icon: AccessTimeIcon,
      value: 13,
      label: "Urgent Cases",
      change: "-2%",
      isPositive: false,
    },
    {
      icon: TrendingUpIcon,
      value: "2",
      label: "Available Staff",
      change: "+5%",
      isPositive: true,
    },
    {
      icon: TrendingUpIcon,
      value: "55m",
      label: "Longest Wait Time",
      change: "+5%",
      isPositive: true,
      lastUpdated: "2024-06-01 14:30",
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
        sx={{
          width: "100%",
          maxWidth: { sm: "100%", md: "100%" },
          p: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
          Overview
        </Typography>
        <Grid container spacing={2} columns={15} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
          Current Queues
        </Typography>
        <TableContainer component={Paper}>
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
