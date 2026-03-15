import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Chip, Grid, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ShieldIcon from "@mui/icons-material/Shield";
import SectionCard from "../components/StaffComponents/SectionCard";
import DetailRow from "../components/StaffComponents/DetailRow";

const dummyCase = {
  departmentId: "HOMELESSNESS",
  referenceNumber: "BOB-1234",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Error ad blanditiis asperiores doloribus pariatur, fuga, omnis esse, labore placeat repellat sequi consectetur dolor corporis iusto aliquam ratione consequuntur sit incidunt iure mollitia eligendi magni. Dignissimos est voluptatibus vitae vel, autem ipsum sequi nisi fuga quidem nam veritatis facere, eius velit.",
  status: "OPEN",
  priority: true,
  flag: false,
  notes:
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quod enim quisquam veniam voluptates rem necessitatibus placeat aspernatur numquam iure architecto.",
  enquiry:
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus molestiae inventore nisi eius atque unde obcaecati nobis adipisci minima consequuntur beatae maiores nostrum deserunt harum delectus quos, debitis quia in accusamus reprehenderit iure corrupti voluptatum?",
  otherEnquiryText: "someOtherDetails",
  childrenCount: "4",
  householdSize: "7",
  ageRange: "16-25",
  hasDisabilityorSensory: false,
  disabilityType: "blind",
  domesticAbuse: false,
  safeToContact: "yes",
  urgent: "yes",
  urgentReason: "HEALTH OR MOBIlITY",
  urgentReasonOtherText: "Some other urgent text",
  supportNotes:
    "They need help with a lot of things — they only speak this language!",
  supportNeeds: ["ACCESSIBILITY", "LANGUAGE", "SEATING"],
  otherSupport: "I don't know",
  additionalInfo: "Some additional info",
  name: "Bob Test",
  tickets: [{ id: "123", status: "WAITING" }],
};

const StaffCaseDetails = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const c = dummyCase;

  const statusColorMap: Record<
    string,
    "success" | "warning" | "error" | "default"
  > = {
    OPEN: "success",
    CLOSED: "default",
    PENDING: "warning",
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Case Management
        </Typography>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={600}>
            {c.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            #{c.referenceNumber} &middot; {c.departmentId}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent="flex-end"
        >
          <Chip
            label={c.status}
            color={statusColorMap[c.status] ?? "default"}
            size="small"
          />
          {c.priority && (
            <Chip
              icon={<PriorityHighIcon />}
              label="Priority"
              color="error"
              size="small"
            />
          )}
          {c.flag && (
            <Chip
              icon={<ShieldIcon />}
              label="Safeguarding"
              color="warning"
              size="small"
            />
          )}
        </Stack>
      </Stack>

      <Stack spacing={2}>
        {/* Case Overview */}
        <SectionCard title="Case Overview">
          <DetailRow label="Description" value={c.description} />
        </SectionCard>

        {/* Resident Details */}
        <SectionCard title="Resident Details">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow label="Full Name" value={c.name} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow label="Age Range" value={c.ageRange} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow label="Household Size" value={c.householdSize} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow label="Number of Children" value={c.childrenCount} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow label="Safe to Contact" value={c.safeToContact} />
            </Grid>
          </Grid>
        </SectionCard>

        {/* Enquiry */}
        <SectionCard title="Enquiry">
          <Stack spacing={2}>
            <DetailRow label="Details" value={c.enquiry} />
            {c.otherEnquiryText && (
              <DetailRow
                label="Other Enquiry Details"
                value={c.otherEnquiryText}
              />
            )}
          </Stack>
        </SectionCard>

        {/* Vulnerability & Support */}
        <SectionCard title="Vulnerability & Support Needs">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow
                label="Disability / Sensory Need"
                value={
                  c.hasDisabilityorSensory ? c.disabilityType : "None reported"
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DetailRow
                label="Domestic Abuse"
                value={c.domesticAbuse ? "Yes" : "No"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12 }}>
              <DetailRow label="Support Notes" value={c.supportNotes} />
            </Grid>
            {c.supportNeeds && c.supportNeeds.length > 0 && (
              <Grid size={{ xs: 12, sm: 12 }}>
                <DetailRow
                  label="Support Needs"
                  value={
                    <Stack
                      direction="row"
                      spacing={0.5}
                      flexWrap="wrap"
                      mt={0.25}
                    >
                      {c.supportNeeds.map((need) => (
                        <Chip
                          key={need}
                          label={need.replace(/_/g, " ")}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  }
                />
              </Grid>
            )}
            {c.otherSupport && (
              <Grid size={{ xs: 12, sm: 12 }}>
                <DetailRow label="Other Support" value={c.otherSupport} />
              </Grid>
            )}
          </Grid>
        </SectionCard>

        {/* Urgency */}
        {c.urgent === "yes" && (
          <SectionCard title="Urgency">
            <Stack spacing={2}>
              <DetailRow label="Urgent Reason" value={c.urgentReason} />
              {c.urgentReasonOtherText && (
                <DetailRow
                  label="Additional Urgency Details"
                  value={c.urgentReasonOtherText}
                />
              )}
            </Stack>
          </SectionCard>
        )}

        {/* Notes & Additional Info */}
        <SectionCard title="Notes & Additional Information">
          <Stack spacing={2}>
            {c.notes && <DetailRow label="Notes" value={c.notes} />}
            {c.additionalInfo && (
              <DetailRow label="Additional Info" value={c.additionalInfo} />
            )}
          </Stack>
        </SectionCard>

        {/* Tickets */}
        {c.tickets.length > 0 && (
          <SectionCard title="Linked Tickets">
            <Stack spacing={1}>
              {c.tickets.map((ticket) => (
                <Stack
                  key={ticket.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ py: 0.5 }}
                >
                  <Typography variant="body2">Ticket #{ticket.id}</Typography>
                  <Chip label={ticket.status} size="small" />
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        )}
      </Stack>
    </Box>
  );
};

export default StaffCaseDetails;
