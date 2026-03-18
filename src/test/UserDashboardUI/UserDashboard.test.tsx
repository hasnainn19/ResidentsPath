import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import '@testing-library/jest-dom';
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Authenticator } from '@aws-amplify/ui-react';

import theme from '../../Constants/Theme';
import UserDashboard from "../../pages/UserDashboard";
import { useState } from "react";


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


vi.mock('../../hooks/useTicketQueueInfo', () => {
  return {
    useTicketQueueInfo: () => {
      const [steppedOut, setSteppedOut] = useState(false);
      const [notificationsEnabled, setNotificationsEnabled] = useState(false);

      return {
        position: 1,
        waitTimeLower: 5,
        waitTimeUpper: 10,
        ticketId: '123',
        steppedOut,
        setSteppedOut,
        notificationsEnabled,
        setNotificationsEnabled,
        error: null,
      };
    },
  };
});

vi.mock('../../hooks/useUser', () => ({
    useUser: () => ({ user: { email: 'test@test.com', phoneNumber: '1234567890' } }),
}));


vi.mock('aws-amplify/api', () => ({
    generateClient: () => ({
        mutations: {
        handleSteppedOut: vi.fn().mockResolvedValue({ errors: [] }),
        toggleNotifications: vi.fn().mockResolvedValue({ errors: [] }),
        },
    }),
}));


describe("UserDashboard", () => {
  let user: UserEvent;

    beforeAll(() => {
        Object.defineProperty(window, "speechSynthesis", {
            value: {
            getVoices: () => [{ name: "Test Voice", lang: "en-GB" }],
            speak:vi.fn(),
            cancel: vi.fn(),
            pause: vi.fn(),
            resume: vi.fn(),
            },
            writable: true,
        });
    });

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup();

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
    });


    it("Step-out dialog shows up when StepOut button is clicked", async () => {
        await expect(screen.queryByLabelText('stepOut-dialog')).not.toBeInTheDocument();
        await user.click(screen.getByLabelText('stepOut-button'));

        expect(await screen.findByLabelText('stepOut-dialog')).toBeInTheDocument();
    });

    it("Step-out dialog disappears when canceled", async () => {
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
        });;
        expect(await screen.findByLabelText('stepOut-alert')).toBeInTheDocument();
    });


    it("Step out alert is no longer shown when you click the same button", async () => {
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





    // it("Notifications dialog is shown when enable notifications button is clicked", async () => {
    //     const notifButton=await screen.getByLabelText('notifications-button')
    //     expect(notifButton).toBeInTheDocument();
    //     await user.click(notifButton);
    // });


    // it("Notifications alert disappears when Returned button is clicked", async () => {
    //     await user.click(screen.getByLabelText('notifications-button'));
    //     expect(await screen.findByLabelText('notifications-alert')).toBeInTheDocument();

    //     await user.click(screen.getByLabelText('notifications-button'));
    //     await expect(screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();
    // });


    // it("Notifications alert disappears when closed", async () => {
    //     await waitFor(() => {
    //         expect(screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();
    //     });

    //     await user.click(screen.getByLabelText('notifications-button'));
    //     expect(await screen.findByLabelText('notifications-alert')).toBeInTheDocument();

    //     const closeButton = screen.getByRole("button", { name: /close/i });
    //     await user.click(closeButton);

    //     await expect(screen.queryByLabelText('notifications-alert')).not.toBeInTheDocument();
    // });
});