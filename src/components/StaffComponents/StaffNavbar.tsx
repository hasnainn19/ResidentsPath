import {
  Drawer,
  List,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Accordion,
  AccordionSummary,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import QueueIcon from "@mui/icons-material/FormatListBulleted";
import WorkIcon from "@mui/icons-material/Work";
import PersonIcon from "@mui/icons-material/Person";
import StaffNavItem from "./StaffNavItem";
const drawerWidth = 240;

// This component represents the sidebar navigation for staff users, providing links to key sections of the dashboard such as the main dashboard, current cases, staff directory, and personal cases. It also includes a user profile section with an accordion for additional options like viewing the profile, audit logs, and logging out.
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
          backgroundColor: "primary.main",
          color: "primary.contrastText",
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
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: "primary.contrastText" }}
          >
            ResidentsPath
          </Typography>
          <Typography
            variant="body2"
            sx={{
              opacity: 0.8,
              color: "primary.contrastText",
            }}
          >
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
            label="Manage Tickets"
            url="/staff/queues"
          />
          <StaffNavItem
            icon={<GroupsIcon />}
            label="Current Staff"
            url="/staff"
          />
          <StaffNavItem icon={<WorkIcon />} label="My cases" url="/staff" />
          <StaffNavItem icon={<PersonIcon />} label="User Dashboard" url="/" />
        </Box>
        <Box sx={{ mb: 2, padding: 2 }}>
          <Accordion
            sx={{
              backgroundColor: "transparent",
              color: "primary.contrastText",
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
                color: "primary.contrastText",
              }}
            >
              <Avatar
                src={"https://i.pravatar.cc/150?img=5"}
                sx={{
                  width: 50,
                  height: 50,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  bgcolor: "secondary.main",
                  color: "primary.contrastText",
                }}
              />
              <Box sx={{ ml: 2 }}>
                <Typography
                  variant="body1"
                  fontWeight={500}
                  sx={{
                    mt: 1,
                    color: "primary.contrastText",
                  }}
                >
                  Emily Rodriguez
                </Typography>
                <Typography color="text.contrastText">
                  Council Services
                </Typography>
              </Box>
            </AccordionSummary>
            <Box
              sx={{
                backgroundColor: "primary.main",
                padding: 0,
                width: "100%",
              }}
            >
              <List sx={{ padding: 2 }}>
                <Typography
                  variant="body2"
                  color="text.contrastText"
                  sx={{ mt: 0.5, fontStyle: "italic" }}
                >
                  View Profile
                </Typography>
                <Typography
                  variant="body2"
                  color="text.contrastText"
                  sx={{ mt: 0.5, fontStyle: "italic" }}
                >
                  View Audit Logs
                </Typography>
                <Typography
                  variant="body2"
                  color="text.contrastText"
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
