import { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Card, CardContent, CardActions, Tooltip, Typography, Divider, Box, List, ListItem, ListItemButton, ListItemText, Button, Avatar, Chip} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import TextToSpeechButton from '../components/TextToSpeechButton';

const BookingPanel = () => {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
    const [selectedTime, setSelectedTime] = useState('');
    const [unavailableTimes, setUnavailableTimes] = useState<string[]>([]);

    // Generate 30-minute slots (9am–5pm)
    const generateTimes = () => {
        const times: string[] = [];
        for (let hour = 9; hour < 17; hour++) {
            times.push(`${hour.toString().padStart(2, '0')}:00`);
            times.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        return times;
    };
    const allTimes = generateTimes();

    // Filter out unavailable times and, for today, times that are in the past
    const availableTimes = allTimes.filter((time) => {
        // Always remove times explicitly marked as unavailable
        if (unavailableTimes.includes(time)) {
            return false;
        }

        // If no date is selected, keep the time (current behavior)
        if (!selectedDate) {
            return true;
        }

        const now = dayjs();

        // If the selected date is today, filter out times earlier than or equal to "now"
        if (selectedDate.isSame(now, 'day')) {
            const [hourStr, minuteStr] = time.split(':');
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);

            const slotDateTime = selectedDate
                .hour(hour)
                .minute(minute)
                .second(0)
                .millisecond(0);

            return slotDateTime.isAfter(now);
        }

        // For non-today dates (e.g., future dates), keep all available times
        return true;
    });
    // If the selected time becomes unavailable (e.g., user changes date), clear the selection
    useEffect(() => {
        if (!availableTimes.includes(selectedTime)) {
            setSelectedTime('');
        }
    }, [availableTimes]);

    // When selected date changes, filter unavailable times
    useEffect(() => {
        if (unavailableTimes) {
            allTimes.filter(time => !unavailableTimes.includes(time))
        }
    }, [selectedDate, unavailableTimes]);

    function handleConfirm() {
        // navigate to next page
    }

    function handleClear() {
        setSelectedTime('')
        setSelectedDate(dayjs())
    }

  return (
    <>
    <Typography align="center" variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 5 }}>
        Book your appointment here 
        <TextToSpeechButton text='Book your appointment here'/>
    </Typography>

    <Card variant="outlined" sx={{ borderWidth: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} >
        <CardContent sx={{ p: 3 }}>

            <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 3, flexDirection: 'row' }}>

                {/* Left Side */}
                <Box sx={{ flex: 1, height: '100%',  minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>            
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' , width: 36, height: 36 }}>
                            <CalendarMonthOutlinedIcon />
                        </Avatar>                    
                        <Typography variant="h5" color="text.primary" sx={{ ml: 3, fontWeight: 700}}>
                            Select the date:  
                        <TextToSpeechButton text='Select the date'/>
                        </Typography>
                    </Box>
                    <Box sx={{ minWidth: 320 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <StaticDatePicker displayStaticWrapperAs="desktop" value={selectedDate} onChange={(newValue) => setSelectedDate(newValue)} minDate={dayjs()} sx = {{ color: 'primary.main', }} slotProps={{ toolbar: { toolbarFormat: 'ddd DD MMMM', hidden: false }, actionBar: { actions: [] }, }} />
                        </LocalizationProvider>
                    </Box>
                </Box>

                <Divider orientation="vertical" flexItem aria-hidden="true" sx={{  borderWidth: 1 }} />

                {/* Right Side */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0,}}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' , width: 36, height: 36 }}>
                            <ScheduleOutlinedIcon />
                        </Avatar>                    
                        <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
                            Select a time below:
                            <TextToSpeechButton text='Select a time below'/>
                        </Typography>
                    </Box>
                    
                    <Box className="bookingpage-time-list" sx={{ border: 2, borderColor: 'primary.main', borderRadius: 1,  maxHeight: 300, overflowY: 'scroll' }}>
                            <List disablePadding>
                                {availableTimes.map(time => (
                                <ListItem key={time} disablePadding>
                                    <ListItemButton selected={selectedTime === time} className="bookingpage-time-list-item-btn" onClick={() => setSelectedTime(time)} sx={{ borderBottom: '1px solid #ddd' }}>
                                        <ListItemText primary={time} />
                                    </ListItemButton>
                                </ListItem>
                                ))}
                            </List>
                    </Box>
                    <Chip icon={<HistoryToggleOffOutlinedIcon />} color= "primary" label={selectedTime || '--:--'} variant="outlined" sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.dark', height: 40 }} />
                    <TextToSpeechButton text={ selectedTime? `Your selected appointment time is ${selectedTime}.`: "No appointment time selected." } />
                    <CardActions>
                        <Tooltip title="Clear appointment selection" placement="top">
                            <Button variant="outlined"  onClick={handleClear}  >
                                Clear
                            </Button>
                        </Tooltip>
                        <Tooltip title={'Confirm your appointment'} placement="top">
                            <Button variant="contained"  disabled={!selectedTime} onClick={handleConfirm} sx={{ bgColor:'secondary' }} >
                                Confirm
                            </Button>
                        </Tooltip>
                        <TextToSpeechButton text={ selectedTime? `Your selected appointment time is ${selectedTime}. Click the button on the left to cancel your appointment selection and click the button on the right to confirm your appointment selection.`: `You have not selected an appointment time. Once you have selected an appointment time, click the button on the left to cancel your appointment selection and click the button on the right to confirm your appointment selection.`}/>
                    </CardActions>
                </Box>
            </Box>
        </CardContent>
    </Card>
  </>
  );
};

export default BookingPanel;
