import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  styled,
  Paper,
  Avatar,
  Accordion,
  AccordionSummary,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import QueueIcon from "@mui/icons-material/FormatListBulleted";
import EventIcon from "@mui/icons-material/Event";
import SettingsIcon from "@mui/icons-material/Settings";
import WorkIcon from "@mui/icons-material/Work";
import StaffNavItem from "./StaffNavItem";
const drawerWidth = 240;

const StaffNavbar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#5C2D91",
          color: "white",
        },
      }}
    >
      <Toolbar>
        <Box
          sx={{
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            ResidentsPath
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            staff view
          </Typography>
        </Box>
      </Toolbar>

      <List
        sx={{
          mt: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "calc(100% - 64px)",
        }}
      >
        <Box>
          <StaffNavItem
            icon={<DashboardIcon />}
            label="Dashboard"
            url="/staff"
          />
          <StaffNavItem
            icon={<QueueIcon />}
            label="Current Cases"
            url="/staff/cases"
          />
          {/* <StaffNavItem
            icon={<EventIcon />}
            label="Appointments"
            url="/staff/appointments"
          /> */}
          <StaffNavItem
            icon={<EventIcon />}
            label="Current Staff"
            url="/staff/directory"
          />
          <StaffNavItem
            icon={<WorkIcon />}
            label="My cases"
            url="/staff/my-cases"
          />
          <StaffNavItem icon={<SettingsIcon />} label="Settings" url="/staff" />
        </Box>
        <Box sx={{}}>
          <Accordion
            sx={{
              backgroundColor: "transparent",
              color: "white",
              boxShadow: "none",
            }}
          >
            <AccordionSummary
              sx={{
                px: 0,
                py: 0,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar
                src={"https://i.pravatar.cc/150?img=5"}
                sx={{
                  width: 50,
                  height: 50,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography variant="body1" fontWeight={500} sx={{ mt: 1 }}>
                  Emily Rodriguez
                </Typography>
                <Typography color="text.primary">Council Services</Typography>
              </Box>
            </AccordionSummary>
            <Box sx={{ backgroundColor: "white", padding: 0, width: "100%" }}>
              <List>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, fontStyle: "italic" }}
                >
                  View Profile
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, fontStyle: "italic" }}
                >
                  View Audit Logs
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, fontStyle: "italic" }}
                >
                  Logout
                </Typography>
              </List>
            </Box>
          </Accordion>
        </Box>
      </List>
    </Drawer>
  );
};

export default StaffNavbar;
