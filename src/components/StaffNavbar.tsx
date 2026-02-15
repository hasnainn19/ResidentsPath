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

      <List sx={{ mt: 3 }}>
        <StaffNavItem icon={<DashboardIcon />} label="Dashboard" url="/staff" />
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
      </List>
    </Drawer>
  );
};

export default StaffNavbar;
