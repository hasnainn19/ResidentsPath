import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from "aws-amplify/api";
import { Grid, styled, Paper, Typography, Box, Button, Stack, Alert, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import DangerousIcon from '@mui/icons-material/Dangerous';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';

import type { Schema } from '../../amplify/data/resource';
import TextToSpeechButton from '../components/TextToSpeechButton';
import NavBar from '../components/NavBar';
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
    const {  t: translate } = useTranslation();
    const [showStepOutAlert, setShowStepOutAlert] = useState(false);
    const [showNotificationsAlert, setShowNotificationsAlert] = useState(false);
    const [errors, setErrors] = useState('');
    const [stepOutDialogOpen, setStepOutDialogOpen] = useState(false);
    const [enableNotificationsDialogOpen, setEnableNotificationsDialogOpen] = useState(false);
        const {
        position, waitTimeLower, waitTimeUpper,
        ticketId,
        steppedOut, setSteppedOut,
        notificationsEnabled, setNotificationsEnabled,
        error: fetchError,
    } = useTicketQueueInfo(caseId);

    useEffect(() => {
        if (fetchError) {
            setErrors(fetchError);
        }
    }, [fetchError]);

    const executeHandleSteppedOut = async (steppedOut: boolean): Promise<boolean> => {
        console.log("here");
        if (!ticketId)
        {
            setErrors('Empty ticket ID!');
            return false;
        }
        try {
            const { errors: stepOutErrors } = await client.mutations.handleSteppedOut({ ticketId, caseId: caseId!, steppedOut });
            if (stepOutErrors && stepOutErrors.length > 0) {
                setErrors(stepOutErrors[0].message);
                return false;
            }
            setSteppedOut(steppedOut);
            return true;
        }
        catch (error) {
            setErrors(`Failed to ${steppedOut ? 'step out' : 'update'}: ${error}`);
            return false;
        }
    };

    const executeToggleNotifications = async (
        enabled: boolean,
        contactMethod?: 'SMS' | 'EMAIL',
        contactValue?: string,
    ): Promise<boolean> => {
        if (!ticketId) 
        {
            setErrors('Empty ticket ID!');
            return false;
        }

        try {
            const { errors: notifErrors } = await client.mutations.toggleNotifications({
                ticketId,
                caseId: caseId!,
                enabled,
                contactMethod,
                contactValue,
            });
            if (notifErrors && notifErrors.length > 0) {
                setErrors(notifErrors[0].message);
                return false;
            }
            setNotificationsEnabled(enabled);
            return true;
        }
        catch (error) {
            setErrors(`Failed to ${enabled ? 'enable' : 'disable'} notifications: ${error}`);
            return false;
        }
    };

    const handleStepOutConfirm = async (contactMethod: 'SMS' | 'EMAIL', contactValue: string) => {
        setStepOutDialogOpen(false);
        const success = await executeToggleNotifications(true, contactMethod, contactValue);
        if (success) {
            const stepOutSuccess = await executeHandleSteppedOut(true);
            if (stepOutSuccess) {
                setShowStepOutAlert(true);
            }
        }
    };

    const handleEnableNotificationsConfirm = async (contactMethod: 'SMS' | 'EMAIL', contactValue: string) => {
        setEnableNotificationsDialogOpen(false);
        const success = await executeToggleNotifications(true, contactMethod, contactValue);
        if (success) {
            setShowNotificationsAlert(true);
        }
    };

    const handleDisableNotifications = async () => {
        const success = await executeToggleNotifications(false);
        if (success) {
            setShowNotificationsAlert(false);
        }
    };

    const handleReturned = async () => {
        const success = await executeHandleSteppedOut(false);
        if (success) {
            setShowStepOutAlert(false);
        }
    };

    const handleStepOut = async () => {
        if (notificationsEnabled) {
            const success = await executeHandleSteppedOut(true);
            if (success) setShowStepOutAlert(true);
        } 
        else {
            setStepOutDialogOpen(true);
        }
    };


    return (
        <>
            <NavBar />
            <Box sx={{minHeight: '90vh', width: '100%', display: 'flex', justifyContent: 'center'}}>
                <Box sx={{ width: '80vw', pt:6 }}>
                    {showNotificationsAlert && (
                        <Alert 
                            aria-label='notifications-alert'
                            severity="success"
                            sx={{mb:2}}
                            action={
                                <IconButton
                                aria-label="close-notifications-alert"
                                onClick={() => setShowNotificationsAlert(false)}
                                >
                                <CloseIcon />
                            </IconButton>
                            }
                        >
                            {translate("userdash-notifications")}
                        </Alert>
                    )}
                    {showStepOutAlert && (
                        <Alert
                        aria-label='stepOut-alert'
                        severity="info"
                        sx={{mb:2}}
                        action={
                            <IconButton
                                aria-label="close-stepOut-alert"
                                onClick={() => setShowStepOutAlert(false)}
                                >
                                <CloseIcon />
                            </IconButton>
                        }
                        >
                            {translate("userdash-stepout")}
                        </Alert>
                    )}
                    {(errors) && (
                        <Alert
                            aria-label='error-alert'
                            severity="error"
                            color="error"
                            action={
                                <IconButton
                                    aria-label="close-errors-alert"
                                    onClick={() => setErrors('')}
                                    >
                                    <CloseIcon />
                                </IconButton>
                            }
                        >
                            {errors}
                        </Alert>
                    )}
                    <Paper variant='outlined' sx={{ p:5, width:'100%'}}>
                        <Grid container sx={{alignItems: 'stretch', width: '100%' }} spacing={2}>
                            <Stack spacing={4} sx={{ width: '100%' }}>
                                <Grid size={12}>
                                    <Item sx={{backgroundColor:'success.main'}}>
                                        <Typography variant='h4'>{translate("userdash-you")}
                                            <TextToSpeechButton text='You are currently in the queue!'/>
                                        </Typography>
                                    </Item>
                                </Grid>
                                <Stack direction='row' spacing={2}>
                                    <Grid size={6}>
                                        <Item>
                                            <Typography variant='body1'>{translate("userdash-there")}</Typography>
                                            <Typography variant='h5' sx={{color:'primary.main'}}>{position}</Typography>
                                            <Typography variant='body1'>{translate("userdash-people")}</Typography>
                                            <TextToSpeechButton text={`There are ${position} people ahead of you`}/>
                                        </Item>
                                    </Grid>
                                    <Grid size={6}>
                                        <Item>
                                            <Typography variant='body1'>{translate("userdash-est")}</Typography>
                                            <Typography variant='h5' sx={{color:'primary.main'}}>
                                                {waitTimeLower} {translate("userdash-to")} {waitTimeUpper} {translate("userdash-min")}
                                            </Typography>
                                            <TextToSpeechButton text={`Estimated wait time is ${waitTimeLower} to ${waitTimeUpper} minutes`} />
                                        </Item>
                                    </Grid>
                                </Stack>
                                <Grid size={12}>
                                    <Item sx={{ textAlign: 'left', backgroundColor: '#e8f5e9' }}>
                                        <Stack spacing={1}>
                                            <Typography variant='h6'>
                                                {translate("userdash-would")}
                                                <TextToSpeechButton text='Would you like to receive notification updates about your status in the queue? We can send you an SMS or email as your turn approaches.' />
                                            </Typography>
                                            <Typography variant='body1'>{translate("userdash-wesend")}</Typography>
                                            <Stack direction='row' spacing={2}>
                                                <Button
                                                    aria-label='notifications-button'
                                                    className='dashboardBtn'
                                                    variant={notificationsEnabled ? 'outlined' : 'contained'}
                                                    sx={{ borderColor: 'primary.main' }}
                                                    endIcon={<NotificationsIcon />}
                                                    onClick={() => notificationsEnabled ? handleDisableNotifications() : setEnableNotificationsDialogOpen(true)}
                                                >
                                                    {notificationsEnabled ? translate("userdash-stopnotf") : translate("userdash-enablenotf")}
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Item>
                                </Grid>
                                <Grid size={12}>
                                    <Item sx={{ textAlign: 'left', backgroundColor:'#e0eeff'}}>
                                        <Stack spacing={1}>
                                            <Typography variant='h6'>{translate("userdash-need")}
                                                <TextToSpeechButton text='If you need to leave the building, click the button below. We can send you updates as your turn approaches. Upon returning, click the button again.'/>
                                            </Typography>
                                            <Typography variant='body1'>{translate("userdash-if")}</Typography>
                                            <Stack direction='row' spacing={2}>
                                                <Button
                                                    aria-label='stepOut-button'
                                                    className='dashboardBtn'
                                                    variant={steppedOut ? 'outlined' : 'contained'}
                                                    sx={{ borderColor: 'primary.main' }}
                                                    endIcon={steppedOut ? <CommentsDisabledIcon /> : <DirectionsWalkIcon />}
                                                    onClick={steppedOut ? handleReturned : handleStepOut}
                                                >
                                                    {steppedOut ? translate("userdash-ret") : translate("userdash-im")}
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Item>
                                </Grid>
                                <Grid size={12}>
                                    <Item sx={{ textAlign: 'left', backgroundColor:'warning.light'}}>
                                        <Stack direction='row' alignItems='flex-start'>
                                            <DangerousIcon sx={{color:'red', m:0.6}}/>
                                            <Typography variant='h6'>{translate("userdash-please")}
                                                <TextToSpeechButton text='Please note, wait times are estimated and may vary. Urgent cases may be prioritised and seen before you. We appreciate your patience and understanding.' />
                                            </Typography>
                                        </Stack>
                                        <Typography variant='body1'>{translate("userdash-wait")}</Typography>
                                        <Typography variant='subtitle2' color={'error.main'} fontWeight={500}>{translate("userdash-we")}</Typography>
                                    </Item>
                                </Grid>
                            </Stack>
                        </Grid>
                    </Paper>
                </Box>
            </Box>

            <ContactDetailsDialog
                title={translate("userdash-wouldyou")}
                description={translate("userdash-wewill")}
                confirmLabel="Step out"
                aria-label='stepOut-dialog'
                open={stepOutDialogOpen}
                onClose={() => setStepOutDialogOpen(false)}
                onConfirm={handleStepOutConfirm}
                prefillEmail={user?.email}
                prefillPhone={user?.phoneNumber}
            />
            <ContactDetailsDialog
                title={translate("userdash-getqueue")}
                description={translate("userdash-notify")}
                confirmLabel="Enable notifications"
                aria-label='notifications-dialog'
                open={enableNotificationsDialogOpen}
                onClose={() => setEnableNotificationsDialogOpen(false)}
                onConfirm={handleEnableNotificationsConfirm}
                prefillEmail={user?.email}
                prefillPhone={user?.phoneNumber}
            />
        </>
    )
}
