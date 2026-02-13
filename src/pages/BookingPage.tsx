import React, {useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Box,
  Select,
  MenuItem
} from '@mui/material';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const BookingPage = () => {
    const [dateValue, setDateValue] = useState<Dayjs | null>(dayjs('2022-04-17'));
    const [selectedTime, setSelectedTime] = useState("");
    const [unavailableTimes, setUnavailableTimes] = useState([]);

    // Generate 30-minute slots (9am–5pm)
    const generateTimes = () => {
        const times: string[] = [];
        for (let hour = 9; hour < 17; hour++) {
        times.push(`${hour.toString().padStart(2, "0")}:00`);
        times.push(`${hour.toString().padStart(2, "0")}:30`);
        }
        return times;
    };

    const allTimes = generateTimes();

    const availableTimes = allTimes.filter(
        (time) => !unavailableTimes.includes(time)
    );

    // Reset selected time if it becomes unavailable
    useEffect(() => {
        if (!availableTimes.includes(selectedTime)) {
        setSelectedTime("");
        }
    }, [availableTimes]);


        return (

        <Card variant="outlined" >
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    {/* LEFT SIDE */}
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar value={dateValue} onChange={(newValue) => setDateValue(newValue)} />
                    </LocalizationProvider>

                    <Divider orientation="vertical" flexItem />

                    {/* RIGHT SIDE */}
                    <Box display="flex" flexDirection="column" gap={2} minWidth={200}>
                        <Typography variant="h6">
                        Selected Date:{" "}
                        {dateValue ? dateValue.format("YYYY-MM-DD") : "None"}
                        </Typography>

                        <Select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        displayEmpty
                        fullWidth
                        >
                        <MenuItem value="" disabled>
                            Select a time
                        </MenuItem>

                        {availableTimes.map((time) => (
                            <MenuItem key={time} value={time}>
                            {time}
                            </MenuItem>
                        ))}
                        </Select>
                    </Box>
                </Stack>
            </CardContent>

        </Card>

    );
}

export default BookingPage;