import StaffNavbar from "../components/StaffNavbar";
import { Box, Grid, Paper, Typography } from "@mui/material";

import {
  People as PeopleIcon,
  HowToReg as HowToRegIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingUp,
} from "@mui/icons-material";
import StatCard from "../components/StatCard";
import QueueItem from "../components/QueueItem";

const StaffDashboard = () => {
  const stats = [
    {
      icon: PeopleIcon,
      value: 248,
      label: "Waiting in reception",
      change: "+12%",
      isPositive: true,
    },
    {
      icon: HowToRegIcon,
      value: 182,
      label: "Stepped Out",
      change: "+8%",
      isPositive: true,
    },
    {
      icon: AccessTimeIcon,
      value: 38.5,
      label: "Priority",
      change: "-2%",
      isPositive: false,
    },
    {
      icon: TrendingUpIcon,
      value: "94%",
      label: "Available Staff",
      change: "+5%",
      isPositive: true,
    },
  ];

  const queues = [
    {
      service: "Primary Care",
      waiting: 12,
      averageWaitTime: "15 mins",
      averagePriority: "Medium",
      steppedOut: 3,
    },
    {
      service: "Emergency",
      waiting: 8,
      averageWaitTime: "5 mins",
      averagePriority: "High",
      steppedOut: 1,
    },
    {
      service: "Specialist ",
      waiting: 5,
      averageWaitTime: "25 mins",
      averagePriority: "Low",
      steppedOut: 2,
    },
    {
      service: "Pharmacy",
      waiting: 18,
      averageWaitTime: "10 mins",
      averagePriority: "Medium",
      steppedOut: 4,
    },
  ];

  return (
    <div>
      <Box sx={{ display: "flex" }}>
        <StaffNavbar />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              width: "100%",
              maxWidth: 1200,
              boxSizing: "border-box",
            }}
          >
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              Current Stats
            </Typography>

            <Grid
              sx={{ justifyContent: "center" }}
              container
              spacing={3}
              width={"100%"}
            >
              {stats.map((stat) => (
                <Grid sx={{ width: "20%" }} key={stat.label}>
                  <StatCard
                    icon={stat.icon}
                    value={stat.value}
                    label={stat.label}
                    change={stat.change}
                    isPositive={stat.isPositive}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: 4,
              width: "100%",
              maxWidth: 1200,
              boxSizing: "border-box",
              bgcolor: "white",
            }}
          >
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
              All Queues
            </Typography>

            {queues.map((queue, index) => (
              <QueueItem
                key={index}
                service={queue.service}
                waiting={queue.waiting}
                averageWaitTime={queue.averageWaitTime}
                averagePriority={queue.averagePriority}
                steppedOut={queue.steppedOut}
              />
            ))}
          </Paper>
        </Box>
      </Box>
    </div>
  );
};

export default StaffDashboard;
