import { Box, Paper, Typography, Button, Grid } from "@mui/material";

interface QueueItemProps {
  service: string;
  waiting: number;
  averageWaitTime: string;
  averagePriority: string;
  steppedOut: number;
}
const QueueItem = ({
  service,
  waiting,
  averageWaitTime,
  averagePriority,
  steppedOut,
}: QueueItemProps) => {
  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Service
          </Typography>
          <Typography variant="body1">{service}</Typography>
        </Grid>

        <Grid item xs={6} sm={6} md={1.5}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Waiting
          </Typography>
          <Typography variant="body1">{waiting}</Typography>
        </Grid>

        <Grid item xs={6} sm={6} md={2}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Average Wait Time
          </Typography>
          <Typography variant="body1">{averageWaitTime}</Typography>
        </Grid>

        <Grid item xs={6} sm={6} md={1.5}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Average Priority
          </Typography>
          <Typography variant="body1">{averagePriority}</Typography>
        </Grid>

        <Grid item xs={6} sm={6} md={1.5}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Stepped Out
          </Typography>
          <Typography variant="body1">{steppedOut}</Typography>
        </Grid>

        <Grid item xs={12} sm={12} md={3}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={600}
            sx={{ mb: 1 }}
          >
            Actions
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" size="small">
              Recall
            </Button>
            <Button variant="outlined" size="small">
              Update
            </Button>
            <Button variant="outlined" size="small" color="error">
              Message
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default QueueItem;
