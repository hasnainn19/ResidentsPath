import { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/api";
import {Grid, styled, Paper, Typography, Box, Button, Stack, Alert} from '@mui/material';
import {Dangerous, DirectionsWalk, CommentsDisabled} from '@mui/icons-material';
import type { Schema } from '../../amplify/data/resource';

import TextToSpeechButton from '../components/TextToSpeechButton';
import NavBar from '../components/NavBar';

const Item = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'background.default',
    padding: theme.spacing(2),
    height: '100%',
    justifyContent: 'center',
    textAlign: 'center',
    border: "1px solid #bbb9bb",
    color: 'text.secondary',
    boxSizing: "border-box",  
}));

const client = generateClient<Schema>();

export default function UserDashboard() {
    const[showStepOutAlert, setShowStepOutAlert]=useState(false);
    const[stepOut, setStepOut]=useState(false);
    const [queuePosition, setQueuePosition] = useState(null); 
    const [estWaitTime, setEstWaitTime] = useState(null);
    const [tickets, setTickets] = useState<Schema["DailyTicket"]["type"][]>([]);

    const handleStepOut = () => {
        setStepOut(true);
        setShowStepOutAlert(true);
    };

    const handleReturned = () => {
        setStepOut(false);
        setShowStepOutAlert(false);
    };

    useEffect(() => {
    // async function fetchDailyTickets() {
    //   try {
    //     const { data, errors } = await client.queries.getDailyTickets();

    //     if (errors) {
    //       console.error(errors);
    //       return;
    //     }

    //     setTickets(data ?? []);
    //   } catch (err) {
    //     console.error("Failed to fetch tickets:", err);
    //   }
    // }

    async function fetchDailyTickets() {
      try {
        const { data, errors } = await client.queries.getDailyTickets();

        if (errors) {
          console.error(errors);
          return;
        }

        // Ensure we only pass non-null items to setTickets
        const raw = (data ?? []) as Array<Schema["DailyTicket"]["type"] | null | undefined>;
        const filtered = raw.filter((t): t is Schema["DailyTicket"]["type"] => t != null);

        setTickets(filtered);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
      }
    }

    fetchDailyTickets();
  }, []);

    
    function calculateWaitTime () {

    }

    

    return (
        <>
            <NavBar />
            <Box sx={{minHeight: '90vh', width: '100%', display: 'flex', justifyContent: 'center'}}>
                <Box sx={{ width: '80vw', pt:6 }}>
                    {showStepOutAlert && (
                        <Alert severity="info" sx={{mb:2}} onClose={() => setShowStepOutAlert(false)}>You've stepped out. We've notified staff and you'll receive updates about your estimated waiting time.</Alert>
                    )}
                    <Paper variant='outlined' sx={{ p:5, width:'100%'}}>
                        <Grid container sx={{alignItems: 'stretch', width: '100%' }} spacing={2}>
                            <Stack spacing={4} sx={{ width: '100%' }}>
                                <Grid size={12}>
                                    <Item sx={{backgroundColor:'success.main'}}>
                                        <Typography variant='h4'>You are in the queue!
                                            <TextToSpeechButton text='You are currently in the queue!'/>
                                        </Typography>
                                    </Item>
                                </Grid>
                                <Stack direction='row' spacing={2}>
                                    <Grid size={6}>
                                        <Item>
                                            <Typography variant='body1'>You are the </Typography>
                                            <Typography variant='h5' sx={{color:'primary.main'}}>{queuePosition}</Typography>
                                            <Typography variant='body1'>person in the queue</Typography>
                                            <TextToSpeechButton text='You are the Nth person in the queue'/>
                                        </Item>
                                    </Grid>
                                    <Grid size={6}>
                                        <Item>
                                            <Typography variant='body1'>Estimated waiting time is:</Typography>
                                            <Typography variant='h5' sx={{color:'primary.main'}}>{estWaitTime}</Typography>
                                            <TextToSpeechButton text='Estimated wait time is 15-30 minutes'/>
                                        </Item>
                                    </Grid>
                                </Stack>
                                <Grid size={12}>
                                    <Item sx={{ textAlign: 'left', backgroundColor:'#e0eeff'}}>
                                        <Stack spacing={1}>
                                            <Typography variant='h6'>Need to step out?
                                                <TextToSpeechButton text='If you need to leave the building, click the button on the left. We can send you updates as your turn approaches. Upon returning click the button on the right to stop receiving updates.'/>
                                            </Typography>
                                            <Typography variant='body1'>If you need to leave the building, we can send you updates as your turn approaches.</Typography>
                                            <Stack direction='row' spacing={2}>
                                                <Button className='dashboardBtn' variant='contained' sx={{borderColor:'primary.main'}} endIcon={<DirectionsWalk/>} onClick={handleStepOut} disabled={stepOut}>I'm stepping out</Button>
                                                <Button className='dashboardBtn' variant='contained' sx={{borderColor:'primary.main'}} endIcon={<CommentsDisabled />} onClick={handleReturned} disabled={!stepOut} >I've returned - stop updates</Button>
                                            </Stack>
                                        </Stack>
                                    </Item>
                                </Grid>
                                <Grid size={12}>
                                    <Item sx={{ textAlign: 'left', backgroundColor:'warning.main'}}>
                                        <Stack direction='row' alignItems='flex-start'>
                                            <Dangerous sx={{color:'red', m:0.6}}/>
                                            <Typography variant='h6'>Please note
                                                <TextToSpeechButton text='Please note, wait times are estimated and may vary. Urgent cases may be prioritised and seen before you. We appreciate your patience and understanding.' />
                                            </Typography>
                                        </Stack>
                                        <Typography variant='body1'>Wait times are estimated and may vary. Urgent cases may be prioritised and seen before you.</Typography>
                                        <Typography variant='subtitle2' color={'error.main'} fontWeight={500}>We appreciate your patience and understanding.</Typography>
                                    </Item>
                                </Grid>
                            </Stack>
                        </Grid>
                    </Paper>
                </Box>
            </Box>
        </>
    )
}
