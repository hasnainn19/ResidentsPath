import { useState } from 'react';
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
import { useTicketQueueInfo } from '../hooks/useTicketQueueInfo';


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
    const client = generateClient<Schema>({ authMode: "userPool" });

    const {
        position, waitTimeLower, waitTimeUpper,
        ticketId,
        steppedOut, setSteppedOut,
        notificationsEnabled, setNotificationsEnabled,
        error: fetchError,
    } = useTicketQueueInfo(caseId);

    const [showStepOutAlert, setShowStepOutAlert] = useState(false);
    const [showNotificationsAlert, setShowNotificationsAlert] = useState(false);
    const [errors, setErrors] = useState('');
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
            setSteppedOut(true);
            setShowStepOutAlert(true);
        }
        catch (error) {
            setErrors(`Failed to step out: ${error}`);
        }
    };

    const handleStepOutConfirm = async (contactMethod: 'SMS' | 'EMAIL', contactValue: string) => {
        setStepOutDialogOpen(false);
        if (!ticketId) return;

        try {
            const { errors: notifErrors } = await client.mutations.toggleNotifications({
                ticketId,
                caseId: caseId!,
                enabled: true,
                contactMethod,
                contactValue,
            });
            if (notifErrors && notifErrors.length > 0) {
                setErrors(notifErrors[0].message);
                return;
            }
            setNotificationsEnabled(true);
        }
        catch (error) {
            setErrors(`Failed to enable notifications: ${error}`);
            return;
        }

        await executeStepOut();
    };

    const handleEnableNotificationsConfirm = async (contactMethod: 'SMS' | 'EMAIL', contactValue: string) => {
        setEnableNotificationsDialogOpen(false);
        if (!ticketId) return;

        try {
            const { errors: notifErrors } = await client.mutations.toggleNotifications({
                ticketId,
                caseId: caseId!,
                enabled: true,
                contactMethod,
                contactValue,
            });
            if (notifErrors && notifErrors.length > 0) {
                setErrors(notifErrors[0].message);
                return;
            }
            setNotificationsEnabled(true);
            setShowNotificationsAlert(true);
        }
        catch (error) {
            setErrors(`Failed to enable notifications: ${error}`);
        }
    };

    const handleDisableNotifications = async () => {
        if (!ticketId) return;

        try {
            const { errors: notifErrors } = await client.mutations.toggleNotifications({
                ticketId,
                caseId: caseId!,
                enabled: false,
            });
            if (notifErrors && notifErrors.length > 0) {
                setErrors(notifErrors[0].message);
                return;
            }
            setNotificationsEnabled(false);
            setShowNotificationsAlert(false);
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
            setSteppedOut(false);
            setShowStepOutAlert(false);
        } 
        catch (error) {
            setErrors(`Failed to update: ${error}`);
        }
    };


    return (
        <>
            <NavBar />
            <Box sx={{minHeight: '90vh', width: '100%', display: 'flex', justifyContent: 'center'}}>
                <Box sx={{ width: '80vw', pt:6 }}>
                    {showNotificationsAlert && (
                        <Alert severity="success" sx={{mb:2}} onClose={() => setShowNotificationsAlert(false)}>Notifications enabled. We'll send you updates as your turn approaches.</Alert>
                    )}
                    {showStepOutAlert && (
                        <Alert severity="info" sx={{mb:2}} onClose={() => setShowStepOutAlert(false)}>You've stepped out. We've notified staff and you'll receive updates about your estimated waiting time.</Alert>
                    )}
                    {(errors || fetchError) && (
                        <Alert severity="error" color="error" onClose={() => setErrors('')}>
                            {errors || fetchError}
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
                                            <Typography variant='h5' sx={{color:'primary.main'}}>{position}</Typography>
                                            <Typography variant='body1'>people ahead of you</Typography>
                                            <TextToSpeechButton text={`There are ${position} people ahead of you`}/>
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
                                                    variant={notificationsEnabled ? 'outlined' : 'contained'}
                                                    sx={{ borderColor: 'primary.main' }}
                                                    endIcon={<NotificationsIcon />}
                                                    onClick={() => notificationsEnabled ? handleDisableNotifications() : setEnableNotificationsDialogOpen(true)}
                                                >
                                                    {notificationsEnabled ? 'Stop notifications' : 'Enable notifications'}
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
                                                    variant={steppedOut ? 'outlined' : 'contained'}
                                                    sx={{ borderColor: 'primary.main' }}
                                                    endIcon={steppedOut ? <CommentsDisabledIcon /> : <DirectionsWalkIcon />}
                                                    onClick={steppedOut
                                                        ? handleReturned
                                                        : () => notificationsEnabled ? executeStepOut() : setStepOutDialogOpen(true)
                                                    }
                                                >
                                                    {steppedOut ? "I've returned" : "I'm stepping out"}
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
