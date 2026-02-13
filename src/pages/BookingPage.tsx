import React, { useState, useEffect, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
    Card,
    CardContent,
    Typography,
    Divider,
    Stack,
    Box,
    Select,
    MenuItem,
    TextField
} from '@mui/material';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Autocomplete from '@mui/material/Autocomplete';


const BookingPage = () => {
  const [dateValue, setDateValue] = useState<Dayjs | null>(dayjs('2022-04-17'));
  const [selectedTime, setSelectedTime] = useState("");
  const [unavailableTimes, setUnavailableTimes] = useState([]);
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/London'); // Default UK time

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
  const availableTimes = allTimes.filter(time => !unavailableTimes.includes(time));

  useEffect(() => {
    if (!availableTimes.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [availableTimes]);

    // Get accurate UTC offset in minutes for a timezone
    const getOffsetMinutes = (tz: string) => {
    const now = new Date();
    
    // Convert local time in target timezone to string, then parse
    const localString = now.toLocaleString('en-US', { timeZone: tz });
    const localDate = new Date(localString);

    // UTC offset in minutes = local time - UTC time
    const offsetMinutes = (localDate.getTime() - now.getTime()) / (60 * 1000);

    return Math.round(offsetMinutes); // round to nearest minute
    };


  // Convert offset in minutes to GMT±HH:MM
  const formatGMTOffset = (offsetMinutes: number) => {
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    return `GMT${sign}${hours}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''}`;
  };

  // Generate sorted timezone list in GMT format
  const timezones = useMemo(() => {
    const commonRegions = ['UTC', 'Europe', 'America', 'Asia', 'Australia'];
    const allTz = Intl.supportedValuesOf?.('timeZone') || [
      'UTC', 'Europe/London', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney'
    ];

    const filtered = allTz.filter(tz =>
      commonRegions.some(region => tz.startsWith(region))
    );

    const mapped = filtered.map(tz => {
      const offsetMinutes = getOffsetMinutes(tz);
      const city = tz.split('/')[1]?.replace('_', ' ') || tz;
      return {
        tz,
        label: `${formatGMTOffset(offsetMinutes)} - ${city}`,
        offsetMinutes
      };
    });

    mapped.sort((a, b) => a.offsetMinutes - b.offsetMinutes);
    return mapped;
  }, []);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">

          {/* LEFT SIDE: Calendar + Timezone */}
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h6" mb={1}>
              Please select your appointment date:
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                value={dateValue}
                onChange={(newValue) => setDateValue(newValue)}
              />
            </LocalizationProvider>

            <Typography variant="h6" mt={2} mb={1}>
              Your Timezone:
            </Typography>
            <Autocomplete
                options={timezones} // array of { tz, label, offsetMinutes }
                value={timezones.find(tz => tz.tz === selectedTimezone) || null}
                onChange={(event, newValue) => setSelectedTimezone(newValue?.tz || '')}
                getOptionLabel={(option) => option.label} // still shows GMT + city
                isOptionEqualToValue={(option, value) => option.tz === value.tz}
                clearOnEscape
                fullWidth
                renderOption={(props, option) => {
                    // Map IANA region to country emoji
                    const countryCode = option.tz.split('/')[0] === 'Europe' ? 'GB'
                                    : option.tz.split('/')[0] === 'America' ? 'US'
                                    : option.tz.split('/')[0] === 'Asia' ? 'JP' // example fallback
                                    : option.tz.split('/')[0] === 'Australia' ? 'AU'
                                    : '🌐';

                    const flag = countryCode === '🌐' ? '🌐' : String.fromCodePoint(...[...countryCode].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));

                    return (
                    <li {...props}>
                        <span style={{ marginRight: 8 }}>{flag}</span>
                        {option.label}
                    </li>
                    );
                }}
                renderInput={(params) => (
                    <TextField
                    {...params}
                    label="Your Timezone"
                    placeholder="Select a timezone"
                    variant="outlined"
                    />
                )}
            />


            <Divider sx={{ width: '100%', mt: 2 }} />
          </Box>

          {/* VERTICAL DIVIDER */}
          <Divider orientation="vertical" flexItem />

          {/* RIGHT SIDE: Time selection */}
          <Box display="flex" flexDirection="column" gap={2} minWidth={200}>
            <Typography variant="h6">
              Selected Date: {dateValue ? dateValue.format("YYYY-MM-DD") : "None"}
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
};

export default BookingPage;
