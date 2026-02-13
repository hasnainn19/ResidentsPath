import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Grid,
  Box,
  TextField,
  Button,
  styled,
  Card,
  CardContent,
  CardActions,
  Typography,
  Divider,
  Stack
} from '@mui/material';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const BookingPage = () => {
    const [dateValue, setDateValue] = React.useState<Dayjs | null>(dayjs('2022-04-17'));

    return (

        <Card variant="outlined" >
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar value={dateValue} onChange={(newValue) => setDateValue(newValue)} />
                    </LocalizationProvider>

                    <Divider orientation="vertical" flexItem />

                    <Typography variant="h6" component="div" sx={{ padding: 2 }}>
                        Selected Date: {dateValue ? dateValue.format('YYYY-MM-DD') : 'None'}
                    </Typography>
                </Stack>
            </CardContent>

        </Card>

    );
}

export default BookingPage;