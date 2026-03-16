import { useState, useEffect } from 'react';
import { Button, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputAdornment } from '@mui/material';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { normalisePhoneToE164, isValidEmail } from '../../shared/formSchema';

interface ContactDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (contactMethod: 'SMS' | 'EMAIL', contactValue: string) => void;
    prefillEmail?: string | null;
    prefillPhone?: string | null;
    title: string;
    description: string;
    confirmLabel: string;
}

export default function ContactDetailsDialog({ open, onClose, onConfirm, prefillEmail, prefillPhone, title, description, confirmLabel }: ContactDetailsDialogProps) {
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
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        {description}
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
                            helperText={contactInvalid ? 'Enter a valid phone number.' : prefillPhone ? 'Filled from your account information.' : 'e.g. 07912 345678 or +44...'}
                            fullWidth
                            autoComplete="tel"
                            slotProps={{
                                input: {
                                    readOnly: !!prefillPhone,
                                    endAdornment: prefillPhone ? (
                                        <InputAdornment position="end">
                                            <LockIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                        </InputAdornment>
                                    ) : undefined,
                                },
                                htmlInput: { inputMode: 'tel' },
                            }}
                            sx={prefillPhone ? { '& .MuiInputBase-root': { backgroundColor: 'action.hover' } } : undefined}
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
                            helperText={contactInvalid ? 'Enter a valid email address.' : prefillEmail ? 'Filled from your account information.' : ' '}
                            fullWidth
                            autoComplete="email"
                            slotProps={{
                                input: {
                                    readOnly: !!prefillEmail,
                                    endAdornment: prefillEmail ? (
                                        <InputAdornment position="end">
                                            <LockIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                        </InputAdornment>
                                    ) : undefined,
                                },
                                htmlInput: { inputMode: 'email' },
                            }}
                            sx={prefillEmail ? { '& .MuiInputBase-root': { backgroundColor: 'action.hover' } } : undefined}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    disabled={!contactMethod || !contactValueValid}
                    onClick={handleConfirm}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
