import { Alert, Drawer, List, Toolbar, Typography, Box } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import QueueIcon from "@mui/icons-material/FormatListBulleted";
import WorkIcon from "@mui/icons-material/Work";
import PersonIcon from "@mui/icons-material/Person";
import StaffNavItem from "./StaffNavItem";
import { useAuth } from "../../hooks/useAuth";
import { signOut } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
const drawerWidth = 240;

// This component represents the sidebar navigation for staff users, providing links to key sections of the dashboard such as the main dashboard, current cases, staff directory, and personal cases. It also includes a user profile section with an accordion for additional options like viewing the profile, audit logs, and logging out.
const StaffNavbar = () => {
  const { givenName, familyName } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      setError("Failed to sign out. Please try again.");
    }
  };

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
            icon={<WorkIcon />}
            label="Case Management"
            url="/staff/cases"
          />
          <StaffNavItem icon={<PersonIcon />} label="User Dashboard" url="/" />
        </Box>
        <Box sx={{ mb: 2, padding: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
          <Typography
            variant="body1"
            fontWeight={500}
            sx={{ color: "primary.contrastText" }}
          >
            {givenName?.concat(" ", familyName ? familyName : "")}
          </Typography>
          <Typography
            component="button"
            type="button"
            variant="body2"
            color="text.contrastText"
            onClick={handleLogout}
            sx={{
              mt: 1,
              fontStyle: "italic",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              textAlign: "left",
            }}
          >
            Logout
          </Typography>
        </Box>
      </List>
    </Drawer>
  );
};

export default StaffNavbar;
