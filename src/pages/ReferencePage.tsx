import { Html5Qrcode } from "html5-qrcode";
import { useRef, useState, useEffect } from "react";
import { Tooltip, Container, Grid, Box, TextField, Button, styled, Card, CardContent, CardActions, Typography} from '@mui/material';
import { grey } from '@mui/material/colors';
import Avatar from '@mui/material/Avatar';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import ButtonBase from '@mui/material/ButtonBase';
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';
import Navbar from '../components/NavBar';
import TextToSpeechButton from "../components/TextToSpeechButton";


const ReferencePage = () => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanning, setScanning] = useState(false);
    const [refNo, setRefNo] = useState('');
    const [ qrScanError, setQrScanError] = useState('');


    // Styled component for the QR scanner button
    const ScanButton = styled(ButtonBase)(({ theme }) => ({
        display: 'flex',
        width: '100%',
        height: 220,
        // position: 'relative', 
        backgroundColor: theme.palette.secondary.light,
        border: `2px dashed ${grey[600]}`,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        '&:hover': {
            backgroundColor: '#e3d9faff',
            borderColor: grey[900],
        }
    }));

    // function handleQRScanner() {
    //     setScanning(true);
    //     setTimeout(() => {
    //         const scanner = new Html5Qrcode("qr-reader");
    //         scannerRef.current = scanner;
    //         scanner.start(
    //         { facingMode: "environment" }, // rear camera
    //         { fps: 10, qrbox: 250 },
    //         (decodedText) => {
    //             setRefNo(decodedText)
    //             console.log("Decoded QR code:", decodedText);
    //             // process ref no.
    //             stopScanner();
    //         },
    //         (error) => {
    //             setQrScanError(error);
    //         }
    //         );
    // }, 300)};
function handleQRScanner() {
    if (scanning) return;
    setScanning(true);
}


useEffect(() => {
    if (!scanning) return;
    if (scannerRef.current) return;

    let cancelled = false;

    requestAnimationFrame(() => {
        if (cancelled) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        scanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                setRefNo(decodedText);
                console.log("Decoded QR code:", decodedText);
                stopScanner();
            },
            (error) => {
                setQrScanError(error);
            }
        );
    });

    return () => {
        cancelled = true;
    };
}, [scanning]);




    function stopScanner() {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
            setScanning(false);
            });
        }
    }

    function handleCheckStatus() {
        // process ref no. 
        // navigate to next page
    }

    return (
    <>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center'  }}>
            <Typography variant="h3" component="h1"  gutterBottom sx={{ fontWeight: 700 , mb: 6 }}>
                Use one of the following methods to see more details
            </Typography>
            <Typography variant="h4" component="h2"  gutterBottom sx={{ fontWeight: 700 , mb: 4 }}>
                Check your queue details OR check in for an appointment
                <TextToSpeechButton text='Use one of the following methods to either check yout queue details or check in for an appointment'/>
            </Typography>
            <Grid container spacing={3} sx={{ justifyContent: "center", }}>
                <Grid sx={{ display: 'flex'}} size={6}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1, borderRadius: 3, height: '100%' }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 4 }}>
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

                        <CardActions sx={{ px: 4, pb: 4 }}>
                            <Box sx={{ mt: 'auto', width: '100%' }}>
                                <TextField fullWidth id="outlined-search" label="Reference code" sx={{ mb: 3 }} value={refNo} />
                                <Tooltip title="Check your status" placement="top">
                                    <Button variant="contained" onClick={handleCheckStatus} endIcon={<ManageSearchOutlinedIcon />} className='referencepage-check-status-btn' sx={{ backgroundColor: 'primary.dark', width: '100%' }}>
                                        Check Status
                                    </Button>
                                </Tooltip>
                            </Box>
                        </CardActions>
                    </Card>
                </Grid>

                <Grid  sx={{ display: 'flex'}} size={6}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', borderRadius: 3 }}>
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

                        <CardActions sx={{ px: 4, pb: 4, justifyContent: 'center' }}>
                            <Box sx={{ width: '100%', mx: 'auto', position: 'relative' }}>
                                    <ScanButton onClick={handleQRScanner} sx={{ flexDirection: 'column', py: 3 }}>
                                    {!scanning && (
                                    <>
                                        <QrCodeScannerRoundedIcon fontSize="large" />
                                        <Box component="span" sx={{ mt: 2, fontWeight: 600 }}>
                                        Tap to open scanner
                                        </Box>
                                    </>
                                    )}
                                </ScanButton>
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 220, zIndex: 10, visibility: scanning ? 'visible' : 'hidden', pointerEvents: scanning ? 'auto' : 'none', overflow: 'hidden', borderRadius: 1, }}>
                                    <div id="qr-reader" style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', transform: 'translateZ(0)', objectFit: 'cover' }} />
                                    {scanning && (
                                        <Tooltip title="Cancel QR Scan" placement="top">
                                        <Button variant='contained' size="small" onClick={(e) => { e.stopPropagation(); stopScanner(); }} sx={{ position: 'absolute', top: 6, right: 6, zIndex: 20 }} >
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
