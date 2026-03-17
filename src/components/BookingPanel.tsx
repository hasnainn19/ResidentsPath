import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { generateClient } from "aws-amplify/data";
import {
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Typography,
  Divider,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import HistoryToggleOffOutlinedIcon from "@mui/icons-material/HistoryToggleOffOutlined";
import { useTranslation } from 'react-i18next';
import TextToSpeechButton from "../components/TextToSpeechButton";
import type { Schema } from "../../amplify/data/resource";
import { getDataAuthMode } from "../utils/getDataAuthMode";
import {
  getCurrentAppointmentDateTime,
  isBookableAppointmentTime,
} from "../../shared/formSchema";
import type { DepartmentName } from "../../shared/formSchema";

type Props = {
  departmentName?: DepartmentName;
  onConfirm?: (dateIso: string, time: string) => void;
};

async function fetchAvailableAppointmentTimes(
  departmentName: DepartmentName,
  dateIso: string,
  authMode: Awaited<ReturnType<typeof getDataAuthMode>>,
) {
  const client = generateClient<Schema>();
  const response = await client.queries.getAvailableAppointmentTimes(
    { departmentName, dateIso },
    { authMode },
  );

  return {
    availableTimes: response.data?.availableTimes ?? [],
    errors: response.errors,
  };
}

export default function BookingPanel(props: Props) {
  const theme = useTheme();
  const isMobileLayout = useMediaQuery(theme.breakpoints.down("md"));
  const todayInLondon = dayjs(getCurrentAppointmentDateTime().dateIso);

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(() => dayjs(todayInLondon));
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const {  t: translate } = useTranslation();

  const prettyDate = selectedDate ? selectedDate.format("D MMMM YYYY") : "";
  const selectedDateIso = selectedDate ? selectedDate.format("YYYY-MM-DD") : "";

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!props.departmentName || !selectedDateIso) {
        setAvailableTimes([]);
        setAvailabilityError(null);
        setAvailabilityLoading(false);
        return;
      }

      setAvailabilityLoading(true);
      setAvailabilityError(null);

      try {
        const authMode = await getDataAuthMode();
        const response = await fetchAvailableAppointmentTimes(
          props.departmentName,
          selectedDateIso,
          authMode,
        );

        if (cancelled) {
          return;
        }

        if (response.errors?.length) {
          console.error("getAvailableAppointmentTimes returned errors", response.errors);
          setAvailableTimes([]);
          setAvailabilityError("Unable to load available appointment times right now.");
          setAvailabilityLoading(false);
          return;
        }

        const times = Array.isArray(response.availableTimes)
          ? response.availableTimes.filter(
              (value): value is string =>
                typeof value === "string" && isBookableAppointmentTime(value),
            )
          : [];

        setAvailableTimes(times);
        setAvailabilityLoading(false);
      } catch (error) {
        console.error("Failed to load appointment availability", error);

        if (cancelled) {
          return;
        }

        setAvailableTimes([]);
        setAvailabilityError("Unable to load available appointment times right now.");
        setAvailabilityLoading(false);
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [props.departmentName, selectedDateIso]);

  useEffect(() => {
    if (selectedTime && !availableTimes.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [availableTimes, selectedTime]);

  function handleConfirm() {
    if (!selectedDate || !selectedTime || !availableTimes.includes(selectedTime)) return;
    props.onConfirm?.(selectedDate.format("YYYY-MM-DD"), selectedTime);
    setConfirmOpen(true);
  }

  function handleClear() {
    setSelectedTime("");
    setSelectedDate(dayjs(todayInLondon));
  }

  return (
    <>
      <Card variant="outlined" sx={{ borderWidth: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
              gap: 3,
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            {/* Left Side */}
            <Box
              sx={{
                flex: 1,
                height: "100%",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Avatar
                  sx={{ bgcolor: "primary.light", color: "primary.dark", width: 36, height: 36 }}
                >
                  <CalendarMonthOutlinedIcon />
                </Avatar>
                <Typography
                  variant={isMobileLayout ? "h6" : "h5"}
                  color="text.primary"
                  sx={{ ml: 3, fontWeight: 700 }}
                >
                  {translate("Bpanel-select")}
                  <TextToSpeechButton text="Select the date" />
                </Typography>
              </Box>

              {isMobileLayout ? (
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    "& .MuiDateCalendar-root": {
                      width: "100%",
                      maxWidth: 320,
                      m: 0,
                    },
                    "& .MuiPickersCalendarHeader-root": {
                      px: 1,
                    },
                  }}
                >
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={selectedDate}
                    onChange={(newValue) => {
                      setSelectedDate(newValue);
                      setSelectedTime("");
                    }}
                    minDate={todayInLondon}
                    sx={{ color: "primary.main" }}
                    slotProps={{
                      toolbar: { hidden: true },
                      actionBar: { actions: [] },
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ minWidth: 320 }}>
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={selectedDate}
                    onChange={(newValue) => {
                      setSelectedDate(newValue);
                      setSelectedTime("");
                    }}
                    minDate={todayInLondon}
                    sx={{ color: "primary.main" }}
                    slotProps={{
                      toolbar: { toolbarFormat: "ddd DD MMMM", hidden: false },
                      actionBar: { actions: [] },
                    }}
                  />
                </Box>
              )}
            </Box>

            <Divider
              orientation={isMobileLayout ? "horizontal" : "vertical"}
              flexItem
              aria-hidden="true"
              sx={{ borderWidth: 1 }}
            />

            {/* Right Side */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Avatar
                  sx={{ bgcolor: "primary.light", color: "primary.dark", width: 36, height: 36 }}
                >
                  <ScheduleOutlinedIcon />
                </Avatar>
                <Typography
                  variant={isMobileLayout ? "h6" : "h5"}
                  color="text.primary"
                  sx={{ fontWeight: 700 }}
                >
                  {translate("Bpanel-time")}
                  <TextToSpeechButton text="Select a time below" />
                </Typography>
              </Box>

              <Box
                className="bookingpage-time-list"
                sx={{
                  border: 2,
                  borderColor: "primary.main",
                  borderRadius: 1,
                  maxHeight: 300,
                  overflowY: "scroll",
                }}
              >
                <List disablePadding>
                  {availabilityLoading ? (
                    <ListItem>
                      <ListItemText primary={translate("Bpanel-load")} />
                    </ListItem>
                  ) : availabilityError ? (
                    <ListItem>
                      <ListItemText
                        primary={translate("Bpanel-unable")}
                        secondary={availabilityError}
                      />
                    </ListItem>
                  ) : availableTimes.length === 0 ? (
                    <ListItem>
                      <ListItemText
                        primary={translate("Bpanel-no-avai")}
                        secondary={translate("Bpanel-please")}
                      />
                    </ListItem>
                  ) : (
                    availableTimes.map((time) => (
                      <ListItem key={time} disablePadding>
                        <ListItemButton
                          selected={selectedTime === time}
                          className="bookingpage-time-list-item-btn"
                          onClick={() => setSelectedTime(time)}
                          sx={{ borderBottom: "1px solid #ddd" }}
                        >
                          <ListItemText primary={time} />
                        </ListItemButton>
                      </ListItem>
                    ))
                  )}
                </List>
              </Box>

              <Chip
                icon={<HistoryToggleOffOutlinedIcon />}
                color="primary"
                label={selectedTime || "--:--"}
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  bgcolor: "primary.light",
                  color: "primary.dark",
                  height: 40,
                }}
              />

              <TextToSpeechButton
                text={
                  selectedTime ? `${translate("Bpanel-your")} ${selectedTime}.` : translate("Bpanel-no")
                }
              />

              {isMobileLayout ? (
                <CardActions>
                  <Stack direction="column" spacing={1.5} sx={{ width: "100%" }}>
                    <Tooltip title={translate("Bpanel-clear")} placement="top">
                      <Button variant="outlined" onClick={handleClear} fullWidth>
                        {translate("Bpanel-cl")}
                      </Button>
                    </Tooltip>

                    <Tooltip title={translate("Bpanel-confirm")} placement="top">
                      <Button
                        variant="contained"
                        disabled={!selectedTime || availabilityLoading}
                        onClick={handleConfirm}
                        sx={{ backgroundColor: "secondary" }}
                        fullWidth
                      >
                        {translate("Bpanel-conf")}
                      </Button>
                    </Tooltip>

                    <TextToSpeechButton
                      text={
                        selectedTime
                          ? `Your selected appointment time is ${selectedTime}. Click the button on the left to cancel your appointment selection and click the button on the right to confirm your appointment selection.`
                          : `You have not selected an appointment time. Once you have selected an appointment time, click the button on the left to cancel your appointment selection and click the button on the right to confirm your appointment selection.`
                      }
                    />
                  </Stack>
                </CardActions>
              ) : (
              <CardActions>
                <Tooltip title={translate("Bpanel-clear")} placement="top">
                  <Button variant="outlined" onClick={handleClear}>
                    {translate("Bpanel-cl")}
                  </Button>
                </Tooltip>

                <Tooltip title={translate("Bpanel-confirm")} placement="top">
                  <Button
                    variant="contained"
                    disabled={!selectedTime}
                    onClick={handleConfirm}
                    sx={{ bgColor: "secondary" }}
                  >
                    {translate("Bpanel-conf")}
                  </Button>
                </Tooltip>

                  <TextToSpeechButton
                    text={
                      selectedTime
                        ? `Your selected appointment time is ${selectedTime}. Click the button on the left to cancel your appointment selection and click the button on the right to confirm your appointment selection.`
                        : `You have not selected an appointment time. Once you have selected an appointment time, click the button on the left to cancel your appointment selection and click the button on the right to confirm your appointment selection.`
                    }
                  />
                </CardActions>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="appointment-confirmed-title"
        fullWidth={isMobileLayout}
        maxWidth={isMobileLayout ? "xs" : false}
      >
        <DialogTitle id="appointment-confirmed-title">{translate("Bpanel-app")}</DialogTitle>

        <DialogContent dividers>
          <Typography variant="body1">
            {prettyDate} {translate("Bpanel-at")} {selectedTime}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            variant="contained"
            fullWidth={isMobileLayout}
          >
            {translate("Bpanel-ok")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
