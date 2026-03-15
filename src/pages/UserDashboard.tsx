import { useState, useEffect } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from "aws-amplify/api";
import { Grid, styled, Paper, Typography, Box, Button, Stack, Alert } from '@mui/material';
import DangerousIcon from '@mui/icons-material/Dangerous';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TextToSpeechButton from '../components/TextToSpeechButton';
import NavBar from '../components/NavBar';
import { useParams } from 'react-router-dom';
import ContactDetailsDialog from '../components/ContactDetailsDialog';
import { useUser } from '../hooks/useUser';


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
    const { user } = useUser();
    const [showStepOutAlert, setShowStepOutAlert]=useState(false);
    const [stepOut, setStepOut]=useState(false);
    const [errors, setErrors] = useState('');
    const [ticketId, setTicketId] = useState<string | null>(null);
    const [queuePosition, setQueuePosition] = useState(0);
    const [waitTimeLower, setWaitTimeLower] = useState(0);
    const [waitTimeUpper, setWaitTimeUpper] = useState(0);

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [stepOutDialogOpen, setStepOutDialogOpen] = useState(false);
    const [enableNotificationsDialogOpen, setEnableNotificationsDialogOpen] = useState(false);

    const executeStepOut = async () => {
        if (!ticketId) return;
        try {
            const { errors: stepOutErrors } = await client.mutations.handleSteppedOut({ ticketId, caseId: caseId!, steppedOut: true });
            if (stepOutErrors && stepOutErrors.length > 0) {
                setErrors(stepOutErrors[0].message);
                return;
            }
            setStepOut(true);
            setShowStepOutAlert(true);
        }
        catch (error) {
            setErrors(`Failed to step out: ${error}`);
        }
    };

    const handleStepOutConfirm = async (contactMethod: 'SMS' | 'EMAIL', contactValue: string) => {
        setStepOutDialogOpen(false);
        // TODO: call enableNotifications(ticketId, caseId, contactMethod, contactValue) once backend is ready
        console.log('Step out contact:', contactMethod, contactValue);
        await executeStepOut();
    };

    const handleEnableNotificationsConfirm = async (contactMethod: 'SMS' | 'EMAIL', contactValue: string) => {
        setEnableNotificationsDialogOpen(false);
        if (!ticketId) return;

        try {
            // TODO: call enableNotifications(ticketId, caseId, contactMethod, contactValue) once backend is ready
            console.log('Enable notifications contact:', contactMethod, contactValue);
            setNotificationsEnabled(true);
        }
        catch (error) {
            setErrors(`Failed to enable notifications: ${error}`);
        }
    };

    const handleDisableNotifications = async () => {
        if (!ticketId) return;

        try {
            // TODO: call disableNotifications(ticketId, caseId) once backend is ready
            setNotificationsEnabled(false);
        }
        catch (error) {
            setErrors(`Failed to disable notifications: ${error}`);
        }
    };

    const handleReturned = async () => {
        if (!ticketId) return;
        
        try {
            const { errors: returnedErrors } = await client.mutations.handleSteppedOut({ ticketId, caseId: caseId!, steppedOut: false });
            if (returnedErrors && returnedErrors.length > 0) {
                setErrors(returnedErrors[0].message);
                return;
            }
            setStepOut(false);
            setShowStepOutAlert(false);
        } 
        catch (error) {
            setErrors(`Failed to update: ${error}`);
        }
    };


    useEffect(() => {
        fetchTicketQueueInfo();

        // Poll every 30 seconds for updates
        // Could use subscriptions for real-time updates, but it may show a lot of flickering changes
        // in the UI as the tickets are all updated.
        const interval = setInterval(() => {
            fetchTicketQueueInfo();
        }, 30000); // refresh every 30 seconds

        return () => clearInterval(interval); // cleanup on unmount
    }, []);

    const client = generateClient<Schema>({ authMode: "userPool" });

    async function fetchTicketQueueInfo() {
        try {
            if (!caseId) {
                return;
            }
            const { data: ticketInfo, errors: ticketErrors} = await client.queries.getTicketInfo({ caseId: caseId });

            if (ticketErrors && ticketErrors.length > 0) {
                setErrors(ticketErrors[0].message);
                return;
            }
            if (!ticketInfo) {
                return;
            }

            setTicketId(ticketInfo.ticketId);
            setQueuePosition(ticketInfo.position);
            setWaitTimeLower(ticketInfo.estimatedWaitTimeLower);
            setWaitTimeUpper(ticketInfo.estimatedWaitTimeUpper);
            setStepOut(ticketInfo.steppedOut);

        } 
        catch (error) {
            setErrors(`Failed to fetch tickets: ${error}`);
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
                        <Alert severity="error" color="error" onClose={() => setErrors('')}>
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
                                    <Item sx={{ textAlign: 'left', backgroundColor: '#e8f5e9' }}>
                                        <Stack spacing={1}>
                                            <Typography variant='h6'>
                                                Would you like to receive notification updates about your status in the queue?
                                                <TextToSpeechButton text='Would you like to receive notification updates about your status in the queue? We can send you an SMS or email as your turn approaches.' />
                                            </Typography>
                                            <Typography variant='body1'>We can send you an SMS or email as your turn approaches.</Typography>
                                            <Stack direction='row' spacing={2}>
                                                <Button
                                                    className='dashboardBtn'
                                                    variant={notificationsEnabled ? 'contained' : 'outlined'}
                                                    sx={{ borderColor: 'primary.main' }}
                                                    endIcon={<NotificationsIcon />}
                                                    onClick={() => notificationsEnabled ? handleDisableNotifications() : setEnableNotificationsDialogOpen(true)}
                                                >
                                                    {notificationsEnabled ? 'Stop notifications' : 'Get queue notifications'}
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Item>
                                </Grid>
                                <Grid size={12}>
                                    <Item sx={{ textAlign: 'left', backgroundColor:'#e0eeff'}}>
                                        <Stack spacing={1}>
                                            <Typography variant='h6'>Need to step out?
                                                <TextToSpeechButton text='If you need to leave the building, click the button below. We can send you updates as your turn approaches. Upon returning, click the button again.'/>
                                            </Typography>
                                            <Typography variant='body1'>If you need to leave the building, we can send you updates as your turn approaches.</Typography>
                                            <Stack direction='row' spacing={2}>
                                                <Button
                                                    className='dashboardBtn'
                                                    variant='contained'
                                                    sx={{ borderColor: 'primary.main' }}
                                                    endIcon={stepOut ? <CommentsDisabledIcon /> : <DirectionsWalkIcon />}
                                                    onClick={stepOut
                                                        ? handleReturned
                                                        : () => notificationsEnabled ? executeStepOut() : setStepOutDialogOpen(true)
                                                    }
                                                >
                                                    {stepOut ? "I've returned" : "I'm stepping out"}
                                                </Button>
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

            <ContactDetailsDialog
                title="How would you like to receive updates?"
                description="We'll notify you as your turn approaches so you can return in time."
                confirmLabel="Step out"
                open={stepOutDialogOpen}
                onClose={() => setStepOutDialogOpen(false)}
                onConfirm={handleStepOutConfirm}
                prefillEmail={user?.email}
                prefillPhone={user?.phoneNumber}
            />
            <ContactDetailsDialog
                title="Get queue notifications"
                description="We'll notify you when your turn is approaching."
                confirmLabel="Enable notifications"
                open={enableNotificationsDialogOpen}
                onClose={() => setEnableNotificationsDialogOpen(false)}
                onConfirm={handleEnableNotificationsConfirm}
                prefillEmail={user?.email}
                prefillPhone={user?.phoneNumber}
            />
        </>
    )
}
