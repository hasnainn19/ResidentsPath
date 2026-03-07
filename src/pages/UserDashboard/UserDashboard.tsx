import { useState, useEffect } from 'react';
import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from "aws-amplify/api";
import {Grid, styled, Paper, Typography, Box, Button, Stack, Alert} from '@mui/material';
import DangerousIcon from '@mui/icons-material/Dangerous';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';

import TextToSpeechButton from '../../components/TextToSpeechButton';
import NavBar from '../../components/NavBar';
import EstimatedWaitingTime from '../../functions/EstimatedWaitingTime';
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
    const [estWaitTime, setEstWaitTime] = useState(0);
    const[ticketDepartment, setTicketDepartment]=useState('');
    const [waitingTickets, setWaitingTickets] = useState<Schema["DailyTicket"]["type"][]>([]);
    const [completedTickets, setCompletedTickets] = useState<Schema["DailyTicket"]["type"][]>([]);

    const handleStepOut = () => {
        setStepOut(true);
        setShowStepOutAlert(true);
    };

    const handleReturned = () => {
        setStepOut(false);
        setShowStepOutAlert(false);
    };

    useEffect(() => {
        fetchDailyTickets();
    }, []);

    useEffect(() => {
        if (waitingTickets.length > 0) {
            calculatePosition();
            calculateWaitTime();
        }
    }, [waitingTickets, completedTickets]);


const client = generateClient<Schema>();

    async function fetchDailyTickets() {
        try {
            const { data, errors } = await client.queries.getDailyTickets();

            if (errors) {
                console.error(errors);
                return;
            }

            // Ensure we only pass non-null items to setTickets
            const raw = (data ?? []) as Array<Schema["DailyTicket"]["type"] | null | undefined>;
            const ticketData = raw.filter((t): t is Schema["DailyTicket"]["type"] => t != null);


            // Find department the ticket belongs to
            let department = null;
            for(const ticket of ticketData)
                if(ticket.caseId == caseId) {
                    if(ticket.departmentName){
                        department = ticket.departmentName;
                        setTicketDepartment(ticket.departmentName)
                    }
                }

            // Only consider tickets in the same department
            const filteredTickets = ticketData.filter(ticket => ticket.departmentName === department);

            // set completed tickets list to be used for calculating estimated waiting time
            const completeTickets = filteredTickets
                .filter(ticket => ticket.status === "COMPLETED")
                .sort((a, b) => {
                    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                    return bTime - aTime;
                })
                .slice(0, 5);

           setCompletedTickets(completeTickets);

            // Only consider WAITING tickets
            const waitingTickets = filteredTickets.filter(ticket => ticket.status === "WAITING");

            waitingTickets.sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeA - timeB; // ascending
            });

            console.log(waitingTickets);
            setWaitingTickets(waitingTickets);
        } catch (err) {
            console.error("Failed to fetch tickets: ", err);
        }
    }


    async function fetchDepartmentEstimatedTime() {
        try {
            const { data, errors } = await client.queries.getDepartmentEstimatedTime({departmentName:ticketDepartment});

            if (errors) {
                console.error(errors);
                return 0;
            }

            return data?.estimatedWaitingtTime;
        }
        catch (err) {
            console.error("Failed to fetch department estimated waiting time: ", err);
            return 0;
        }
    }
    
    async function calculateWaitTime() {
        if (completedTickets.length < 5) 
        {
            const estTime = await fetchDepartmentEstimatedTime();
            setEstWaitTime((estTime ?? 0) * queuePosition);
        }

        else{
            const waitingTimes: number[] = [];

            for (let i = 0; i < completedTickets.length - 1; i++) {
                const createdAt = completedTickets[i].createdAt ?? new Date(0);
                const completedAt = completedTickets[i].completedAt ?? new Date(0);

                const t1 = new Date(createdAt).getTime();
                const t2 = new Date(completedAt).getTime();

                const diffMinutes = Math.abs(t2 - t1) / 60000;
                waitingTimes.push(diffMinutes);
            }

            waitingTimes.sort((a, b) => a - b);

            const mid = Math.ceil(waitingTimes.length / 2);

            const median =
                waitingTimes.length % 2 !== 0
                    ? waitingTimes[mid]
                    : (waitingTimes[mid - 1] + waitingTimes[mid]) / 2;

            console.log("median: "+median)
            //return median;

        }
    }

    function calculatePosition () {
        let position = 0; 
        for(const ticket of waitingTickets) {
            if(ticket.caseId == caseId) {
                setQueuePosition(position)
                return;
            }
            else {
                position++;
                setQueuePosition(position)
            }
        }
        setErrors("The case ID is not in the queue!");
        setQueuePosition(-1);
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
                                            <Typography variant='body1'>There are </Typography>
                                            <Typography variant='h5' sx={{color:'primary.main'}}>{queuePosition}</Typography>
                                            <Typography variant='body1'>people ahead of you</Typography>
                                            <TextToSpeechButton text={`There are ${queuePosition} people ahead of you`}/>
                                        </Item>
                                    </Grid>
                                    <Grid size={6}>
                                        <Item>
                                            <Typography variant='body1'>Estimated waiting time is:</Typography>
                                            <Typography variant='h5' sx={{color:'primary.main'}}>{estWaitTime} to {estWaitTime+20} minutes</Typography>
                                            <TextToSpeechButton text={`Estimated wait time is ${estWaitTime} minutes`} />
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
                                    <Item sx={{ textAlign: 'left', backgroundColor:'warning.main'}}>
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
