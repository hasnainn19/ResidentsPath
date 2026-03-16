import { Html5Qrcode } from "html5-qrcode";
import { useRef, useState, useEffect } from "react";
import {
    Alert,
    Tooltip,
    Container,
    Grid,
    Box,
    TextField,
    Button,
    Card,
    CardContent,
    CardActions,
    Typography,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/NavBar';
import TextToSpeechButton from "../components/TextToSpeechButton";
import AppointmentOptionsDialog from "../components/ReferencePageComponents/AppointmentOptionsDialog";
import ScanButton from "../components/ReferencePageComponents/ScanButton"
import { useNavigate } from 'react-router-dom';
import { useCheckReferenceNumber } from "../hooks/useCheckReferenceNumber";
import { useAppointmentReferenceActions } from "../hooks/useAppointmentReferenceActions";

const ReferencePage = () => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [ scanning, setScanning ] = useState(false);
    const [ refNo, setRefNo ] = useState('');
    const [ qrScanError, setQrScanError] = useState('');
    const {  t: translate } = useTranslation();
    const startingRef = useRef(false);
    const navigate = useNavigate();
    const {
        foundCaseId,
        appointmentReferenceNumber,
        clearAppointmentReference,
        refNoError,
        checkRefNo,
        isChecking,
    } = useCheckReferenceNumber();
    const [ refPageError, setRefPageError] = useState('');
    const {
        actionStatus,
        canCheckInAppointments,
        clearActionStatus,
        isCheckingIn,
        isCancelling,
        checkInAppointmentReference,
        cancelAppointmentReference,
    } = useAppointmentReferenceActions();
    const checkRefNoRef = useRef(checkRefNo);

    useEffect(() => {
        checkRefNoRef.current = checkRefNo;
    }, [checkRefNo]);

    const handleCheckStatus = async () => {
        clearActionStatus();
        await checkRefNo(refNo);
    }
    
    function handleQRScanner() {
        if (scanning || startingRef.current) {
            return;
        }
        startingRef.current = true;
        setScanning(true);
    }

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

    useEffect(() => {
        setRefPageError(refNoError);
    }, [refNoError]);

    useEffect(() => {
        if (foundCaseId) {
            navigate(`/userdashboard/${foundCaseId}`);
        }
    }, [foundCaseId, navigate]);

    function handleCloseAppointmentDialog() {
        clearAppointmentReference();
    }

    async function handleCancelAppointment() {
        if (!appointmentReferenceNumber) {
            return;
        }

        const result = await cancelAppointmentReference(appointmentReferenceNumber);

        if (result.ok) {
            clearAppointmentReference();
            setRefNo('');
        }
    }

    async function handleCheckInAppointment() {
        if (!appointmentReferenceNumber) {
            return;
        }

        const result = await checkInAppointmentReference(appointmentReferenceNumber);

        if (result.alreadyCheckedIn || result.checkedIn) {
            clearAppointmentReference();
            setRefNo('');
        }

        if (result.checkedIn) {
            navigate("/checkinpage");
        }
    }

    useEffect(() => {
        if (!scanning || scannerRef.current) {
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

                    const decodedTextParts = decodedText.trim().split("|");

                    if (decodedTextParts.length !== 2) {
                        setQrScanError("Invalid QR code format");
                        return;
                    }

                    const [type, value] = decodedTextParts;

                    if (type !== "QUEUE" && type !== "APPOINTMENT") {
                        setQrScanError("Incorrect QR Code Prefix");
                        return;
                    }

                    checkRefNoRef.current(value, type);
                },
                () => {}
            )
            .catch((errors) => {
                scannerRef.current = null;
                setScanning(false);
                setQrScanError(`Error occured while scanning QR Code: ${errors}`);
            })
            .finally(() => {
                startingRef.current = false; 
            });

        return () => {
             if (scannerRef.current) {
                 stopScanner();
             }
         };
    }, [scanning]);

    return (
    <>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center', height:'85vh' }}>
            {actionStatus && (
                <Alert severity={actionStatus.severity} onClose={clearActionStatus}>
                    {actionStatus.text}
                </Alert>
            )}
            {refPageError && (
                <Alert  severity="error" color="error" onClose={() => setRefPageError('')}>
                    {refPageError}
                </Alert>
            )}
            {qrScanError && (
                <Alert severity="warning" color="warning" onClose={() => setQrScanError('')}>
                    {qrScanError}
                </Alert>
            )}
            <Typography variant="h3" component="h1"  gutterBottom sx={{ fontWeight: 700 , mb: 6 }}>
                {translate("reference-use")}
            </Typography>
            <Typography variant="h4" component="h2"  gutterBottom sx={{ fontWeight: 700 , mb: 4 }}>
                {translate("reference-check")}
                <TextToSpeechButton text='Use one of the following methods to either check your queue details or check in for an appointment'/>
            </Typography>
            <Grid container spacing={3} sx={{ justifyContent: "center", height: '80%' }}>
                <Grid sx={{ display: 'flex', height: '100%'}} size={5.5}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1, borderRadius: 3, height: '100%' }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
                                <SearchRoundedIcon />
                            </Avatar>
                            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700}}>
                                {translate("reference-manual")}
                            </Typography>
                            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700, mb: 2 }}>
                                {translate("reference-enter")}
                            </Typography>
                            <TextToSpeechButton text='For manual entry, enter your ticket number to see your queue details or enter your appointment reference number to check in for an appointment.'/>
                        </CardContent>

                        <CardActions sx={{ px: 4, pb: 4}}>
                            <Box sx={{ mt: 'auto', width: '100%' }}>
                                <TextField fullWidth value={refNo} id="outlined-search" label={translate("reference-tick")} sx={{ mb: 3 }} onChange={(e) => setRefNo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") {handleCheckStatus(); }}}/> {/* pressing enter also submits ref no. */}  
                                <Tooltip title={translate("reference-check-status")} placement="top">
                                    <Button variant="contained" onClick={handleCheckStatus} disabled={isChecking || isCheckingIn || isCancelling} endIcon={<ManageSearchOutlinedIcon />} className='referencepage-check-status-btn' sx={{ backgroundColor: 'primary.dark', width: '100%' }}>
                                         {translate("reference-check-status")}
                                    </Button>
                                </Tooltip>
                            </Box>
                        </CardActions>
                    </Card>
                </Grid>

                <Grid sx={{ display: 'flex', height: '100%' }} size={5.5}>
                    <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1,  borderRadius: 3 }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' , p: 3 }}>
                            <Avatar sx={{ bgcolor: 'primary.dark'  }}>
                            <QrCode2OutlinedIcon />
                            </Avatar>
                            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                                {translate("reference-scan")}
                            </Typography>
                            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700, mb: 2 }}>
                                 {translate("reference-click")}
                            </Typography>
                            <TextToSpeechButton text='For QR code entry, click the button below to use the camera to scan your QR code.'/>
                        </CardContent>

                        <CardActions sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, height:'100%'}}>
                            <Box sx={{  width: '100%', height: '100%', mx: 'auto', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column'}}>
                                <ScanButton onClick={handleQRScanner} >
                                    {!scanning && (
                                    <>
                                        <QrCodeScannerRoundedIcon fontSize="large"   />
                                        <Box component="span" sx={{ mt: 2, fontWeight: 600, fontSize:"large" }}>
                                             {translate("reference-tap")}
                                        </Box>
                                    </>
                                    )}
                                </ScanButton>
                                <Box sx={{  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, visibility: scanning ? 'visible' : 'hidden', pointerEvents: scanning ? 'auto' : 'none', overflow: 'hidden', borderRadius: 1, }}>
                                    <div id="qr-reader" role="region" aria-label="QR code scanner viewfinder" style={{  width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', transform: 'translateZ(0)', objectFit: 'cover' }} />
                                    {scanning && (
                                        <Tooltip title={translate("reference-cancelqr")} placement="top">
                                            <Button variant='contained' size="small" onClick={(e) => { e.stopPropagation(); stopScanner(); }} sx={{ position: 'absolute', top: '3%', right: '2%', zIndex: 20 }} >
                                                {translate("reference-cancel")}
                                            </Button>
                                        </Tooltip>
                                    )}
                                </Box>
                                {/* Placeholder showing qr code extracts text */}
                                {refNo && (
                                    <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                                        {translate("reference-ref")}: {refNo}
                                    </Typography>
                                )}
                            </Box>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </Container>

        <AppointmentOptionsDialog
            appointmentReferenceNumber={appointmentReferenceNumber}
            canCheckInAppointments={canCheckInAppointments}
            isCheckingIn={isCheckingIn}
            isCancelling={isCancelling}
            onClose={handleCloseAppointmentDialog}
            onCancelAppointment={handleCancelAppointment}
            onCheckInAppointment={handleCheckInAppointment}
        />
    </>
    );
};

export default ReferencePage;
