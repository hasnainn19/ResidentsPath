import { useState, useEffect } from 'react';
import { Button, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import { normalisePhoneToE164, isValidEmail } from '../../shared/formSchema';

interface StepOutContactDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (contactMethod: 'SMS' | 'EMAIL', contactValue: string) => void;
    prefillEmail?: string | null;
    prefillPhone?: string | null;
}

export default function ContactDetailsDialog({ open, onClose, onConfirm, prefillEmail, prefillPhone }: StepOutContactDialogProps) {
    const [contactMethod, setContactMethod] = useState<'SMS' | 'EMAIL' | null>(null);
    const [contactValue, setContactValue] = useState('');
    const [contactTouched, setContactTouched] = useState(false);

    // Reset state each time the dialog opens
    useEffect(() => {
        if (open) {
            setContactMethod(null);
            setContactValue('');
            setContactTouched(false);
        }
    }, [open]);

    const phoneNormalised = contactMethod === 'SMS' ? normalisePhoneToE164(contactValue, 'GB') : undefined;

    let contactValueValid = false;
    if (contactMethod === 'SMS') {
        contactValueValid = !!phoneNormalised;
    } 
    else if (contactMethod === 'EMAIL') {
        contactValueValid = isValidEmail(contactValue);
    }

    let contactInvalid = false;
    if (contactMethod === 'SMS') {
        contactInvalid = contactTouched && contactValue.trim() !== '' && !phoneNormalised;
    } 
    else if (contactMethod === 'EMAIL') {
        contactInvalid = contactTouched && contactValue.trim() !== '' && !isValidEmail(contactValue);
    }

    function handleMethodChange(method: 'SMS' | 'EMAIL') {
        setContactMethod(method);
        setContactTouched(false);
        if (method === 'SMS' && prefillPhone) {
            setContactValue(prefillPhone);
        } 
        else if (method === 'EMAIL' && prefillEmail) {
            setContactValue(prefillEmail);
        } 
        else {
            setContactValue('');
        }
    }

    function handleConfirm() {
        setContactTouched(true);
        if (!contactMethod || !contactValueValid) return;
        
        if (contactMethod === 'SMS') {
            onConfirm(contactMethod, phoneNormalised!);
        } 
        else {
            onConfirm(contactMethod, contactValue.trim());
        }
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>How would you like to receive updates?</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        We'll notify you as your turn approaches so you can return in time.
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Button
                            fullWidth
                            variant={contactMethod === 'SMS' ? 'contained' : 'outlined'}
                            startIcon={<SmsIcon />}
                            onClick={() => handleMethodChange('SMS')}
                        >
                            SMS
                        </Button>
                        <Button
                            fullWidth
                            variant={contactMethod === 'EMAIL' ? 'contained' : 'outlined'}
                            startIcon={<EmailIcon />}
                            onClick={() => handleMethodChange('EMAIL')}
                        >
                            Email
                        </Button>
                    </Stack>
                    {contactMethod === 'SMS' && (
                        <TextField
                            label="Phone number"
                            value={contactValue}
                            onChange={(e) => setContactValue(e.target.value)}
                            onBlur={() => setContactTouched(true)}
                            error={contactInvalid}
                            helperText={contactInvalid ? 'Enter a valid phone number.' : 'e.g. 07912 345678 or +44...'}
                            fullWidth
                            autoComplete="tel"
                            disabled={!!prefillPhone}
                            slotProps={{ htmlInput: { inputMode: 'tel' } }}
                        />
                    )}
                    {contactMethod === 'EMAIL' && (
                        <TextField
                            label="Email address"
                            type="email"
                            value={contactValue}
                            onChange={(e) => setContactValue(e.target.value)}
                            onBlur={() => setContactTouched(true)}
                            error={contactInvalid}
                            helperText={contactInvalid ? 'Enter a valid email address.' : ' '}
                            fullWidth
                            autoComplete="email"
                            disabled={!!prefillEmail}
                            slotProps={{ htmlInput: { inputMode: 'email' } }}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    endIcon={<DirectionsWalkIcon />}
                    disabled={!contactMethod || !contactValueValid}
                    onClick={handleConfirm}
                >
                    Step out
                </Button>
            </DialogActions>
        </Dialog>
    );
}
