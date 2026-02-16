import { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Container, Card, CardContent, CardActions, Tooltip, Typography, Divider, Box, List, ListItem, ListItemButton, ListItemText, Button, Avatar, Chip} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import Navbar from '../components/NavBar'
import TextToSpeechButton from '../components/TextToSpeechButton';

const BookingPage = () => {
    const [selectedDate, setselectedDate] = useState<Dayjs | null>(dayjs());
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

    // Filter out unavailable times for the selected date
    const availableTimes = allTimes.filter(time => !unavailableTimes.includes(time));

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
        setselectedDate(dayjs())
    }

  return (
    <div>
  <Navbar />
  <Container maxWidth="md" sx={{ py: 6 }}>

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
                        <StaticDatePicker displayStaticWrapperAs="desktop" value={selectedDate} onChange={(newValue) => setselectedDate(newValue)} minDate={dayjs()} sx = {{ color: 'primary.main', }} slotProps={{ toolbar: { toolbarFormat: 'ddd DD MMMM', hidden: false }, actionBar: { actions: [] }, }} />
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
                            <ListItem key={time}disablePadding>
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
                    <TextToSpeechButton text={ selectedTime? `Your selected appointment time is ${selectedTime}. Click the button on the left to cancel your appointment selection and click the button on the right to confirm your appointment selection.`: `You have not selected an appointment time. Once you have selected an appoitment time, click the button on the left to cancel your appointment selection and click the button on the right to confirm your appointment selection.`}/>
                </CardActions>
            </Box>
        </Box>
    </CardContent>
    </Card>
  </Container>
  </div>
  );
};

export default BookingPage;
