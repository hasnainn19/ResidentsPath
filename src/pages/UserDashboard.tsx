import {Grid, styled, Paper, Typography, Box, Button, Stack, Icon} from '@mui/material';
import {Dangerous, DirectionsWalk, CommentsDisabled} from '@mui/icons-material';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export default function UserDashboard() {

    const Item = styled(Paper)(({ theme }) => ({
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f7f7f7',
        padding: theme.spacing(2),
        height: '100%',
        justifyContent: 'center',
        textAlign: 'center',
        border: "1px solid #bbb9bb",
        color: (theme.vars ?? theme).palette.text.secondary,
        boxSizing: "border-box",  
        ...theme.applyStyles('dark', {
        }),
    }));

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{minHeight: '90vh', width:'100vw', pt: 3, margin:'auto'}}>
                <Paper variant='outlined' sx={{ p:5, width:'100%', border: '1px solid #bbb9bb'}}>
                    <Grid container sx={{alignItems: 'stretch', width: '100%' }} spacing={2}>
                        <Stack spacing={4} sx={{ width: '100%' }}>
                            <Grid size={12}>
                                <Item sx={{backgroundColor:'#defbd3'}}>
                                    <Typography variant='h4'>You are in the queue!</Typography>
                                </Item>
                            </Grid>
                            <Stack direction='row' spacing={2}>
                                <Grid size={6}>
                                    <Item>
                                        <Typography variant='body1'>You are the </Typography>
                                        <Typography variant='h5' sx={{color:'#6d3874'}}>Nth</Typography>
                                        <Typography variant='body1'>person in the queue</Typography>
                                    </Item>
                                </Grid>
                                <Grid size={6}>
                                    <Item>
                                        <Typography variant='body1'>Estimated waiting time is:</Typography>
                                        <Typography variant='h5' sx={{color:'#6d3874'}}>15-30 minutes</Typography>
                                    </Item>
                                </Grid>
                            </Stack>
                            <Grid size={12}>
                                <Item sx={{ textAlign: 'left', backgroundColor:'#e0eeff'}}>
                                    <Stack spacing={1}>
                                        <Typography variant='h6'>Need to step out?</Typography>
                                        <Typography variant='body1'>If you need to leave the building, we can send you updates as your turn approaches.</Typography>
                                        <Stack direction='row' spacing={2}>
                                            <Button variant='contained' sx={{backgroundColor:'#6d3874', border: '1px solid #6d3874', borderRadius:3}} endIcon={<DirectionsWalk/>}>I'm stepping out</Button>
                                            <Button variant='contained' sx={{backgroundColor:'#6d3874', border: '1px solid #6d3874', borderRadius:3}} endIcon={<CommentsDisabled />}>I've returned - stop updates</Button>
                                        </Stack>
                                    </Stack>
                                </Item>
                            </Grid>
                            <Grid size={12}>
                                <Item sx={{ textAlign: 'left', backgroundColor:'#fdfde9'}}>
                                    <Stack direction='row' spacing={0.5}>
                                        <Dangerous sx={{color:'red', padding:0.5}}/>
                                        <Typography variant='h6'>Please note</Typography>
                                    </Stack>
                                    <Typography variant='body1'>Wait times are estimated and may vary. Urgent cases may prioritised and seen before you.</Typography>
                                    <Typography variant='subtitle2' color='#d95a49'>We appreciate your patience and understanding.</Typography>
                                </Item>
                            </Grid>
                        </Stack>
                    </Grid>
                </Paper>
            </Box>
        </Box>
    )
}
