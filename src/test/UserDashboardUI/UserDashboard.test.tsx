import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from 'react';
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Authenticator } from '@aws-amplify/ui-react';

import theme from '../../Constants/Theme';
import UserDashboard from '../../pages/UserDashboard';

vi.mock('@aws-amplify/ui-react', () => ({
    Authenticator: {
        Provider: ({ children }: { children: React.ReactNode }) => children,
    },
}));

vi.mock('../../components/NavBar', () => ({
    default: () => null,
}));

vi.mock('react-i18next', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-i18next')>();
    return {
        ...actual,
        useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
            changeLanguage: vi.fn(),
        },
        }),
    };
});

const { mockHandleSteppedOut, mockToggleNotifications } = vi.hoisted(() => ({
    mockHandleSteppedOut: vi.fn(),
    mockToggleNotifications: vi.fn(),
}));

vi.mock('../../hooks/useUser', () => ({
  useUser: () => ({
    user: { email: 'test@test.com', phoneNumber: '1234567890' },
  }),
}));

vi.mock('aws-amplify/data', () => ({
    generateClient: () => ({
        mutations: {
            handleSteppedOut: mockHandleSteppedOut,
            toggleNotifications: mockToggleNotifications,
        },
    }),
}));

vi.mock('../../utils/getDataAuthMode', () => ({
    getDataAuthMode: vi.fn().mockResolvedValue('userPool'),
}));

vi.mock('../../hooks/useTicketQueueInfo', () => ({
    useTicketQueueInfo: vi.fn(),
}));

import { useTicketQueueInfo } from '../../hooks/useTicketQueueInfo';

function renderDashboard() {
    render(
        <MemoryRouter>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <ThemeProvider theme={theme}>
                    <Authenticator.Provider>
                        <UserDashboard />
                    </Authenticator.Provider>
                </ThemeProvider>
            </LocalizationProvider>
        </MemoryRouter>
    );
}

function setupSpeechSynthesis() {
    Object.defineProperty(window, "speechSynthesis", {
        value: {
            getVoices: () => [{ name: "Test Voice", lang: "en-GB" }],
            speak: vi.fn(),
            cancel: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
        },
        writable: true,
        configurable: true,
    });
}

describe("Notifications and Step-out UI", () => {
    let user: UserEvent;

    beforeAll(() => {
        setupSpeechSynthesis();
    });

    const setup = ({
        ticketId = '123',
        steppedOutInitial = false,
        notificationsInitial = false,
        handleMock = vi.fn().mockResolvedValue({ errors: [] }),
        toggleMock = vi.fn().mockResolvedValue({ errors: [] }),
    }: {
        ticketId?: string | null;
        steppedOutInitial?: boolean;
        notificationsInitial?: boolean;
        handleMock?: any;
        toggleMock?: any;
    } = {}) => {
        mockHandleSteppedOut.mockImplementation(handleMock);
        mockToggleNotifications.mockImplementation(toggleMock);

        vi.mocked(useTicketQueueInfo).mockImplementation(() => {
            const [steppedOut, setSteppedOut] = useState(steppedOutInitial);
            const [notificationsEnabled, setNotificationsEnabled] = useState(notificationsInitial);
            return {
                position: 1,
                waitTimeLower: 5,
                waitTimeUpper: 10,
                ticketId,
                steppedOut,
                setSteppedOut,
                notificationsEnabled,
                setNotificationsEnabled,
                error: '',
                isLoading: false,
            };
        });

        user = userEvent.setup();
        renderDashboard();
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("Step-out dialog shows up when StepOut button is clicked", async () => {
        setup();
        await expect(screen.queryByLabelText('stepOut-dialog')).not.toBeInTheDocument();
        await user.click(screen.getByLabelText('stepOut-button'));

        expect(await screen.findByLabelText('stepOut-dialog')).toBeInTheDocument();
    });

    it("Step-out dialog disappears when canceled", async () => {
        setup();
        await user.click(screen.getByLabelText('stepOut-button'));
        expect(await screen.findByLabelText('stepOut-dialog')).toBeInTheDocument();

        expect(await screen.findByLabelText('cancel-button')).toBeInTheDocument();
        const cancelButton = screen.getByLabelText('cancel-button');
        await user.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByLabelText('stepOut-dialog')).not.toBeInTheDocument();
        });
    });

    it("Step out alert shows up when you enter phone number in Step-out dialog and confirm", async () => {
        setup();
        await user.click(screen.getByLabelText('stepOut-button'));

        expect(await screen.findByLabelText('stepOut-dialog')).toBeInTheDocument();
        expect(await screen.queryByLabelText('stepOut-alert')).not.toBeInTheDocument();
        expect(await screen.findByLabelText('sms-button')).toBeInTheDocument();

        await user.click(screen.getByLabelText('sms-button'));
        const input = screen.getByLabelText('phone-textfield');
        await user.type(input, '01234567890');

        await user.click(screen.getByLabelText('confirm-button'));

        expect(await screen.findByLabelText('stepOut-alert')).toBeInTheDocument();
    });

    it("Step out alert shows up when you enter email in Step-out dialog and confirm", async () => {
        setup();
        await user.click(screen.getByLabelText('stepOut-button'));

        expect(await screen.findByLabelText('stepOut-dialog')).toBeInTheDocument();
        expect(await screen.queryByLabelText('stepOut-alert')).not.toBeInTheDocument();
        expect(await screen.findByLabelText('email-button')).toBeInTheDocument();

        await user.click(screen.getByLabelText('email-button'));
        const input = screen.getByLabelText('email-textfield');
        await user.type(input, 'test@example.com');

        await user.click(screen.getByLabelText('confirm-button'));

        await waitFor(() => {
            expect(screen.queryByLabelText('stepOut-dialog')).not.toBeInTheDocument();
        });
        expect(await screen.findByLabelText('stepOut-alert')).toBeInTheDocument();
    });


    it("Step out alert is no longer shown when you click the same button", async () => {
        setup();
        await user.click(screen.getByLabelText('stepOut-button'));

        expect(await screen.queryByLabelText('stepOut-alert')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('email-button'));

        expect(await screen.queryByLabelText('stepOut-alert')).not.toBeInTheDocument();

        const input = screen.getByLabelText('email-textfield');
        await user.type(input, 'test@example.com');

        expect(await screen.queryByLabelText('stepOut-alert')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('confirm-button'));

        expect(await screen.findByLabelText('stepOut-alert')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByLabelText('stepOut-dialog')).not.toBeInTheDocument();
        });

        await user.click(screen.getByLabelText('stepOut-button'));

        expect(await screen.queryByLabelText('stepOut-alert')).not.toBeInTheDocument();
    });

    it("Step out alert is no longer shown when you close the alert", async () => {
        setup();
        await user.click(screen.getByLabelText('stepOut-button'));

        await user.click(screen.getByLabelText('email-button'));

        const input = screen.getByLabelText('email-textfield');
        await user.type(input, 'test@example.com');

        expect(await screen.queryByLabelText('stepOut-alert')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('confirm-button'));

        expect(await screen.queryByLabelText('stepOut-alert')).toBeInTheDocument();
        await user.click(screen.getByLabelText("close-stepOut-alert"));

        expect(await screen.queryByLabelText('stepOut-alert')).not.toBeInTheDocument();
    });


    it("Notifications dialog is shown when enable notifications button is clicked", async () => {
        setup()
        expect(await screen.queryByLabelText('notifications-dialog')).not.toBeInTheDocument();
        
        const notifButton=await screen.getByLabelText('notifications-button')
        expect(notifButton).toBeInTheDocument();
        await user.click(notifButton);

        expect(await screen.findByLabelText('notifications-dialog')).toBeInTheDocument();
    });

    it("Notifications dialog disappears when canceled", async () => {
        setup()
        await user.click(screen.getByLabelText('notifications-button'));
        expect(await screen.findByLabelText('notifications-dialog')).toBeInTheDocument();

        expect(await screen.findByLabelText('cancel-button')).toBeInTheDocument();
        const cancelButton = screen.getByLabelText('cancel-button');
        await user.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByLabelText('notifications-dialog')).not.toBeInTheDocument();
        });
    });


     it("Notifications alert shows up when you enter phone number in notifications dialog and confirm", async () => {
        setup()
        await user.click(screen.getByLabelText('notifications-button'));

        expect(await screen.findByLabelText('notifications-dialog')).toBeInTheDocument();
        expect(await screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();
        expect(await screen.findByLabelText('sms-button')).toBeInTheDocument();

        await user.click(screen.getByLabelText('sms-button'));
        const input = screen.getByLabelText('phone-textfield');
        await user.type(input, '01234567890');

        await user.click(screen.getByLabelText('confirm-button'));

        expect(await screen.findByLabelText('notifications-alert')).toBeInTheDocument();
    });

    it("Notifications alert shows up when you enter email in notifications dialog and confirm", async () => {
        setup()
        await user.click(screen.getByLabelText('notifications-button'));

        expect(await screen.findByLabelText('notifications-dialog')).toBeInTheDocument();
        expect(await screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();
        expect(await screen.findByLabelText('email-button')).toBeInTheDocument();

        await user.click(screen.getByLabelText('email-button'));
        const input = screen.getByLabelText('email-textfield');
        await user.type(input, 'test@example.com');

        await user.click(screen.getByLabelText('confirm-button'));

        await waitFor(() => {
            expect(screen.queryByLabelText('notifications-dialog')).not.toBeInTheDocument();
        });
        expect(await screen.findByLabelText('notifications-alert')).toBeInTheDocument();
    });


     it("Notifications alert is no longer shown when you click the same button", async () => {
        setup()
        await user.click(screen.getByLabelText('notifications-button'));

        expect(await screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('email-button'));

        expect(await screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();

        const input = screen.getByLabelText('email-textfield');
        await user.type(input, 'test@example.com');

        expect(await screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('confirm-button'));

        expect(await screen.findByLabelText('notifications-alert')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByLabelText('notifications-dialog')).not.toBeInTheDocument();
        });

        await user.click(screen.getByLabelText('notifications-button'));

        expect(await screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();
    });

    it("Notifications alert is no longer shown when you close the alert", async () => {
        setup()
        await user.click(screen.getByLabelText('notifications-button'));

        await user.click(screen.getByLabelText('email-button'));

        const input = screen.getByLabelText('email-textfield');
        await user.type(input, 'test@example.com');

        expect(await screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('confirm-button'));

        expect(await screen.queryByLabelText('notifications-alert')).toBeInTheDocument();
        await user.click(screen.getByLabelText("close-notifications-alert"));

        expect(await screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();
    });
});



describe('executeHandleSteppedOut function', () => {
    let user: UserEvent;

    beforeAll(() => {
        setupSpeechSynthesis();
    });

    const setup = ({
        ticketId = '123',
        steppedOut = false,
        handleMock = vi.fn().mockResolvedValue({ errors: [] }),
    }: {
        ticketId?: string | null;
        steppedOut?: boolean;
        handleMock?: any;
    } = {}) => {
        mockHandleSteppedOut.mockImplementation(handleMock);

        vi.mocked(useTicketQueueInfo).mockImplementation(() => ({
            ticketId,
            steppedOut,
            setSteppedOut: vi.fn(),
            notificationsEnabled: true,
            setNotificationsEnabled: vi.fn(),
            position: 1,
            waitTimeLower: 5,
            waitTimeUpper: 10,
            error: '',
            isLoading: false,
        }));

        user = userEvent.setup();
        renderDashboard();
    };

    it('shows error if there is no ticketId', async () => {
        setup({ ticketId: null });

        await user.click(screen.getByLabelText('stepOut-button'));

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toHaveTextContent('Empty ticket ID!');
    });

    it('shows stepOut alert successfully when API call succeeds', async () => {
        setup();

        await user.click(screen.getByLabelText('stepOut-button'));

        const stepOutAlert = await screen.findByLabelText('stepOut-alert');
        expect(stepOutAlert).toBeInTheDocument();
    });

    it('sets errors if handleSteppedOut returns errors', async () => {
        setup({
            handleMock: vi.fn().mockResolvedValue({
            errors: [{ message: 'API failed' }],
            }),
        });

        await user.click(screen.getByLabelText('stepOut-button'));

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toHaveTextContent('API failed');
    });

    it('sets errors if handleSteppedOut throws error for step-out ', async () => {
        setup({
            handleMock: vi.fn().mockRejectedValue(new Error('Network error')),
        });

        await user.click(screen.getByLabelText('stepOut-button'));

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toHaveTextContent(
            'Failed to step out: Error: Network error'
        );
    });

    it('sets errors if handleSteppedOut throws error for update', async () => {
        setup({
            handleMock: vi.fn().mockRejectedValue(new Error('Network error')),
            steppedOut:true,
        });

        await user.click(screen.getByLabelText('stepOut-button'));

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toHaveTextContent(
            'Failed to update: Error: Network error'
        );
    });
});



describe('executeToggleNotifications function', () => {
    let user: UserEvent;
    let mockTicketId: string | null;

    const setup = ({
        ticketId = '123',
        notificationsEnabled = true,
        toggleMock = vi.fn().mockResolvedValue({ errors: [] }),
        error: fetchError = null,
    }: {
        ticketId?: string | null;
        notificationsEnabled?: boolean;
        toggleMock?: any;
        error?: string | null;
    } = {}) => {
        mockTicketId = ticketId;
        mockToggleNotifications.mockImplementation(toggleMock);

        vi.mocked(useTicketQueueInfo).mockImplementation(() => ({
            ticketId: mockTicketId,
            steppedOut: false,
            setSteppedOut: vi.fn(),
            notificationsEnabled,
            setNotificationsEnabled: vi.fn(),
            position: 1,
            waitTimeLower: 5,
            waitTimeUpper: 10,
            error: fetchError ?? '',
            isLoading: false,
        }));

        user = userEvent.setup();
        renderDashboard();
    };

    it('shows error if there is no ticketId', async () => {
        setup({ ticketId: null });

        await user.click(screen.getByLabelText('notifications-button'));

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toHaveTextContent('Empty ticket ID!');
    });

    it('shows error if API call returns errors', async () => {
        setup({
            toggleMock: vi.fn().mockResolvedValue({
            errors: [{ message: 'Notif failed' }],
            }),
        });

        await user.click(screen.getByLabelText('notifications-button'));

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toHaveTextContent('Notif failed');
    });

    it('shows error if toggleNotifications throws error when disabling', async () => {
        setup({
            toggleMock: vi.fn().mockRejectedValue(new Error('Network error')),
        });

        await user.click(screen.getByLabelText('notifications-button'));

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toHaveTextContent(
            'Failed to disable notifications: Error: Network error'
        );
    });

    it('shows error if toggleNotifications throws error when enabling', async () => {
        setup({
            toggleMock: vi.fn().mockRejectedValue(new Error('Network error')),
            notificationsEnabled: false,
        });

        await user.click(screen.getByLabelText('notifications-button'));

        await user.click(screen.getByLabelText('email-button'));
        const input = screen.getByLabelText('email-textfield');
        await user.type(input, 'test@example.com');

        await user.click(screen.getByLabelText('confirm-button'));

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toHaveTextContent(
            'Failed to enable notifications: Error: Network error'
        );
    });

    it('shows notifications alert successfully when enabling notifications', async () => {
        setup({
            ticketId: '123',
            notificationsEnabled: false,
            toggleMock: vi.fn().mockResolvedValue({ errors: [] }),
        });

        expect(screen.queryByLabelText('notifications-dialog')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();

        await user.click(screen.getByLabelText('notifications-button'));

        expect(await screen.findByLabelText('notifications-dialog')).toBeInTheDocument();

        await user.click(screen.getByLabelText('email-button'));
        const input = screen.getByLabelText('email-textfield');
        await user.type(input, 'test@example.com');

        await user.click(screen.getByLabelText('confirm-button'));

        await waitFor(() => {
            expect(screen.queryByLabelText('notifications-dialog')).not.toBeInTheDocument();
        });

        expect(await screen.findByLabelText('notifications-alert')).toBeInTheDocument();
    });


    // Error alert
    it('Errors alert closes when clicked its close button', async () => {
        setup({
            toggleMock: vi.fn().mockResolvedValue({
            errors: [{ message: 'Notif failed' }],
            }),
        });

        await user.click(screen.getByLabelText('notifications-button'));

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toHaveTextContent('Notif failed');

        await user.click(screen.getByLabelText("close-errors-alert"));

        expect(await screen.queryByLabelText('error-alert')).not.toBeInTheDocument();
    });

    it('shows error alert when fetchError is present', async () => {
        const errorMsg = 'Failed to fetch ticket info';

        setup({ error: 'Failed to fetch ticket info' });

        const errorAlert = await screen.findByLabelText('error-alert');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(errorMsg);

        const closeButton = screen.getByLabelText('close-errors-alert');
        await user.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByLabelText('error-alert')).not.toBeInTheDocument();
        });
    });
});
