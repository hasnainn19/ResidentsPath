import { useState, useEffect } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from "aws-amplify/api";
import {Grid, styled, Paper, Typography, Box, Button, Stack, Alert} from '@mui/material';
import DangerousIcon from '@mui/icons-material/Dangerous';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';

import TextToSpeechButton from '../components/TextToSpeechButton';
import NavBar from '../components/NavBar';
import { useParams } from 'react-router-dom';


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


export default function UserDashboard() {
    const { caseId } = useParams<{ caseId: string }>();
    const[showStepOutAlert, setShowStepOutAlert]=useState(false);
    const[stepOut, setStepOut]=useState(false);
    const[errors, setErrors] = useState('');
    const [queuePosition, setQueuePosition] = useState(0); 
    const [ waitTimeLower, setWaitTimeLower ] = useState(0);
    const [ waitTimeUpper, setWaitTimeUpper ] = useState(0);



    const handleStepOut = () => {
        setStepOut(true);
        setShowStepOutAlert(true);
    };

    const handleReturned = () => {
        setStepOut(false);
        setShowStepOutAlert(false);
    };

    useEffect(() => {
        fetchTicketQueueInfo();
    }, []);

    const client = generateClient<Schema>({ authMode: "userPool" });

    async function fetchTicketQueueInfo() {
        try {
            if (!caseId) {
                return;
            }
            // get department id of ticket from case id
            const { data: ticketInfo, errors: ticketErrors} = await client.queries.getTicketInfo({ caseId: caseId });

            if (ticketErrors && ticketErrors.length > 0) {
                setErrors(ticketErrors[0].message);
                return;
            }
            if (!ticketInfo) {
                return;
            }
            const ticketDepartmentId = ticketInfo?.departmentId;

            if (!ticketDepartmentId) {
                return;
            }
            // calculate department wait times
            const { data: calcResult, errors: calcErrors} = await client.mutations.calculateDepartmentQueue({ departmentId: ticketDepartmentId });
            
            if (calcErrors && calcErrors.length > 0) {
                setErrors(calcErrors[0].message);
                return;
            }

            if (!calcResult) {
                return;
            }
            // fetch new ticket information to display
            const { data: newTicketInfo, errors: newTicketErrors} = await client.queries.getTicketInfo({ caseId: caseId });

            if (newTicketErrors && newTicketErrors.length > 0) {
                setErrors(newTicketErrors[0].message);
                return;
            }

            if (!newTicketInfo) {
                return;
            }

            setQueuePosition(newTicketInfo?.position ?? 0);
            setWaitTimeLower(newTicketInfo?.estimatedWaitTimeLower ?? 0);
            setWaitTimeUpper(newTicketInfo?.estimatedWaitTimeUpper ?? 0);

        } catch (err) {
            setErrors(`Failed to fetch tickets: ${err}`);
        }
    }

    return (
        <>
            <NavBar />
            <Box sx={{minHeight: '90vh', width: '100%', display: 'flex', justifyContent: 'center'}}>
                <Box sx={{ width: '80vw', pt:6 }}>
                    {showStepOutAlert && (
                        <Alert severity="info" sx={{mb:2}} onClose={() => setShowStepOutAlert(false)}>You've stepped out. We've notified staff and you'll receive updates about your estimated waiting time.</Alert>
                    )}
                    {errors && (
                        <Alert severity="error" color="error" onClose={() => {}}>
                            {errors}
                        </Alert>
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
                                            <Typography variant='body1'>There are </Typography>
                                            <Typography variant='h5' sx={{color:'primary.main'}}>{queuePosition}</Typography>
                                            <Typography variant='body1'>people ahead of you</Typography>
                                            <TextToSpeechButton text={`There are ${queuePosition} people ahead of you`}/>
                                        </Item>
                                    </Grid>
                                    <Grid size={6}>
                                        <Item>
                                            <Typography variant='body1'>Estimated waiting time is:</Typography>
                                            <Typography variant='h5' sx={{color:'primary.main'}}>
                                                {waitTimeLower} to {waitTimeUpper} minutes
                                            </Typography>
                                            <TextToSpeechButton text={`Estimated wait time is ${waitTimeLower} to ${waitTimeUpper} minutes`} />
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
                                                <Button className='dashboardBtn' variant='contained' sx={{borderColor:'primary.main'}} endIcon={<DirectionsWalkIcon />} onClick={handleStepOut} disabled={stepOut}>I'm stepping out</Button>
                                                <Button className='dashboardBtn' variant='contained' sx={{borderColor:'primary.main'}} endIcon={<CommentsDisabledIcon />} onClick={handleReturned} disabled={!stepOut} >I've returned - stop updates</Button>
                                            </Stack>
                                        </Stack>
                                    </Item>
                                </Grid>
                                <Grid size={12}>
                                    <Item sx={{ textAlign: 'left', backgroundColor:'warning.light'}}>
                                        <Stack direction='row' alignItems='flex-start'>
                                            <DangerousIcon sx={{color:'red', m:0.6}}/>
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
