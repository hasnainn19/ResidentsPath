import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

interface StaffMember {
  id: number;
  name: string;
  role: string;
  status: "Available" | "Busy" | "Away";
  avatar?: string;
}

const mockStaff: StaffMember[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Council Services",
    status: "Available",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Housing and homelessness",
    status: "Busy",
    avatar: "https://i.pravatar.cc/150?img=13",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Banking and financial services",
    status: "Available",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: 4,
    name: "David Thompson",
    role: "Business and licensing",
    status: "Away",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
];

const StaffDirectoryPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const filteredStaff = useMemo(() => {
    return mockStaff.filter(
      (s) =>
        (s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.role.toLowerCase().includes(search.toLowerCase())) &&
        (statusFilter === "All Statuses" || s.status === statusFilter),
    );
  }, [search, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return {
          bg: "#d4f4dd",
          text: "#1e7e34",
          dotColor: "#22c55e",
        };
      case "Busy":
        return {
          bg: "#ffe0e0",
          text: "#c62828",
          dotColor: "#ef4444",
        };
      case "Away":
        return {
          bg: "#fff4d6",
          text: "#b8860b",
          dotColor: "#fbbf24",
        };
      default:
        return {
          bg: "#e0e0e0",
          text: "#666",
          dotColor: "#999",
        };
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        width: "100%",
        mx: "auto",
        backgroundColor: "#fafafa",
        minHeight: "100vh",
      }}
    >
      <Typography
        variant="h4"
        fontWeight={700}
        gutterBottom
        sx={{ color: "#1a1a1a" }}
      >
        Staff Directory
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        gutterBottom
        sx={{ mb: 4 }}
      >
        Connect with your team members
      </Typography>

      <Stack direction="row" spacing={2} mb={4}>
        <TextField
          fullWidth
          placeholder="Search by name or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            backgroundColor: "white",
            borderRadius: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              "& fieldset": {
                borderColor: "#e0e0e0",
              },
            },
          }}
        />

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{
            minWidth: 180,
            backgroundColor: "white",
            borderRadius: 3,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#e0e0e0",
            },
          }}
        >
          <MenuItem value="All Statuses">All Statuses</MenuItem>
          <MenuItem value="Available">Available</MenuItem>
          <MenuItem value="Busy">Busy</MenuItem>
          <MenuItem value="Away">Away</MenuItem>
        </Select>
      </Stack>

      <Grid container spacing={3}>
        {filteredStaff.map((staffMember) => {
          const statusColors = getStatusColor(staffMember.status);
          return (
            <Grid sx={{ xs: 12, sm: 6, lg: 4 }} key={staffMember.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  height: 160,
                  width: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  border: "1px solid #f0f0f0",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ width: "100%" }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <Avatar
                        src={staffMember.avatar}
                        sx={{
                          width: 70,
                          height: 70,
                          border: "3px solid white",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 2,
                          right: 2,
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: statusColors.dotColor,
                          border: "2px solid white",
                        }}
                      />
                    </Box>

                    <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{
                          color: "#1a1a1a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {staffMember.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {staffMember.role}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 1 }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ color: "#666" }}
                        >
                          Status:
                        </Typography>
                        <Chip
                          label={staffMember.status}
                          size="small"
                          sx={{
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            fontWeight: 500,
                            border: "none",
                            height: 28,
                          }}
                        />
                      </Stack>
                    </Stack>

                    <Button
                      variant="contained"
                      startIcon={<ChatBubbleOutlineIcon />}
                      sx={{
                        backgroundColor: "#2563eb",
                        borderRadius: 2,
                        textTransform: "none",
                        px: 2.5,
                        py: 1,
                        fontSize: "0.95rem",
                        fontWeight: 500,
                        boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                        "&:hover": {
                          backgroundColor: "#1d4ed8",
                        },
                      }}
                    >
                      Message
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default StaffDirectoryPage;
