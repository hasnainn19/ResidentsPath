import { Html5Qrcode } from "html5-qrcode";
import { useRef, useState, useEffect } from "react";
import { Alert, Tooltip, Container, Grid, Box, TextField, Button,  Card, CardContent, CardActions, Typography} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';
import Navbar from '../components/NavBar';
import TextToSpeechButton from "../components/TextToSpeechButton";
import ScanButton from "../components/ReferencePageComponents/ScanButton"
import { useNavigate } from 'react-router-dom';
import { useCheckTicketNumber } from "../hooks/useCheckTicketNumber";


const ReferencePage = () => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [ scanning, setScanning ] = useState(false);
    const [ refNo, setRefNo ] = useState('');
    // const [ qrScanError, setQrScanError] = useState('');
    const startingRef = useRef(false);
    const navigate = useNavigate();
    const { foundCaseId, ticketNoError, checkTicket, isChecking } = useCheckTicketNumber();

    function handleQRScanner() {
        if (scanning || startingRef.current) {
            return;
        }
        startingRef.current = true;
        setScanning(true);
    }


    useEffect(() => {
        if (!scanning) {
            return;
        }
        if (scannerRef.current) {
            return;
        }

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        scanner
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: 250 },
                (decodedText) => {
                    stopScanner();
                    checkTicket(decodedText);
                },
                (err) => console.error(err)
                )
            .catch(() => {
                scannerRef.current = null;
                setScanning(false);
            })
            .finally(() => {
                startingRef.current = false; 
            });
    }, [scanning]);


    function stopScanner() {
        const scanner = scannerRef.current;

        if (!scanner) {
            setScanning(false);
            startingRef.current = false;
            return;
        }

        scanner
            .stop()
            .catch(() => {}) 
            .finally(() => {
            scanner.clear();
            scannerRef.current = null;
            startingRef.current = false;
            setScanning(false);
            });
    }



    const handleCheckStatus = async () => {
        await checkTicket(refNo);
    }

    useEffect(() => {
        if (foundCaseId) {
            navigate(`/userdashboard/${foundCaseId}`);
        }
    }, [foundCaseId]);

    return (
    <>
        <Navbar />
        <Container maxWidth="lg"  sx={{ py: 6, textAlign: 'center', height:'85vh'  }}>
            {ticketNoError && (
                <Alert  severity="error" color="error" onClose={() => {}}>
                    {ticketNoError}
                </Alert>
            )}
            <Typography variant="h3" component="h1"  gutterBottom sx={{ fontWeight: 700 , mb: 6 }}>
                Use one of the following methods to see more details
            </Typography>
            <Typography variant="h4" component="h2"  gutterBottom sx={{ fontWeight: 700 , mb: 4 }}>
                Check your queue details OR check in for an appointment
                <TextToSpeechButton text='Use one of the following methods to either check your queue details or check in for an appointment'/>
            </Typography>
            <Grid container spacing={3} sx={{ justifyContent: "center", height: '80%' }}>
                <Grid sx={{ display: 'flex', height: '100%'}} size={5.5}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1, borderRadius: 3, height: '100%' }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 4}}>
                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' , mb: 2 }}>
                                <SearchRoundedIcon />
                            </Avatar>
                            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700}}>
                                Manual Entry
                            </Typography>
                            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700, mb: 2 }}>
                                Enter your reference code here:
                            </Typography>
                            <TextToSpeechButton text='For manual entry, enter your reference number in the text field and press the button to check your status.'/>
                        </CardContent>

                        <CardActions sx={{ px: 4, pb: 4}}>
                            <Box sx={{ mt: 'auto', width: '100%' }}>
                                <TextField fullWidth value={refNo} id="outlined-search" label="Reference code" sx={{ mb: 3 }} onChange={(e) => setRefNo(e.target.value)} />
                                <Tooltip title="Check your status" placement="top">
                                    <Button variant="contained" onClick={handleCheckStatus} disabled={isChecking} endIcon={<ManageSearchOutlinedIcon />} className='referencepage-check-status-btn' sx={{ backgroundColor: 'primary.dark', width: '100%' }}>
                                        Check Status
                                    </Button>
                                </Tooltip>
                            </Box>
                        </CardActions>
                    </Card>
                </Grid>

                <Grid sx={{ display: 'flex', height: '100%' }} size={5.5}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1,  borderRadius: 3 }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' , p: 4 }}>
                            <Avatar sx={{ bgcolor: 'primary.dark' , mb: 2 }}>
                            <QrCode2OutlinedIcon />
                            </Avatar>
                            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                                Scan QR Code
                            </Typography>
                            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700, mb: 2 }}>
                                Click to use the camera to scan the QR code:
                            </Typography>
                            <TextToSpeechButton text='For QR code entry, click the button below to use the camera to scan the QR code.'/>
                        </CardContent>

                        <CardActions sx={{ px: 3, pb: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, height:'100%'}}>
                            <Box sx={{  width: '100%', height: '100%', mx: 'auto', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column'}}>
                                <ScanButton onClick={handleQRScanner} >
                                    {!scanning && (
                                    <>
                                        <QrCodeScannerRoundedIcon fontSize="large"   />
                                        <Box component="span" sx={{ mt: 2, fontWeight: 600, fontSize:"large" }}>
                                            Tap to open scanner 
                                        </Box>
                                    </>
                                    )}
                                </ScanButton>
                                <Box sx={{  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, visibility: scanning ? 'visible' : 'hidden', pointerEvents: scanning ? 'auto' : 'none', overflow: 'hidden', borderRadius: 1, }}>
                                    <div id="qr-reader" role="region" aria-label="QR code scanner viewfinder" style={{  width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', transform: 'translateZ(0)', objectFit: 'cover' }} />
                                    {scanning && (
                                        <Tooltip title="Cancel QR Scan" placement="top">
                                            <Button variant='contained' size="small" onClick={(e) => { e.stopPropagation(); stopScanner(); }} sx={{ position: 'absolute', top: '3%', right: '2%', zIndex: 20 }} >
                                                Cancel
                                            </Button>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    </>
    );
};

export default ReferencePage;
