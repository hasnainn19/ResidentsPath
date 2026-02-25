import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from '../../Constants/Theme';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import UserDashboard from "./UserDashboard";

describe("UserDashboard", () => {
  let user;

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
        user = userEvent.setup();

        render(
            <MemoryRouter>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <ThemeProvider theme={theme}>
                        <UserDashboard />
                    </ThemeProvider>
                </LocalizationProvider>
            </MemoryRouter>
        );
    });


    it("Alert shows up when StepOut button is clicked", async () => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /I'm stepping out/i }));

        expect(screen.getByText("You've stepped out. We've notified staff and you'll receive updates about your estimated waiting time.")).toBeInTheDocument();
        expect(screen.queryByRole("alert")).toBeInTheDocument();
    });


    it("Alert disappears when Returned button is clicked", async () => {
        await user.click(screen.getByRole("button", { name: /I'm stepping out/i }));
        expect(screen.queryByRole("alert")).toBeInTheDocument();


        await user.click(screen.getByRole("button", { name: /I've returned - stop updates/i }));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });


    it("Alert disappears when closed", async () => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /I'm stepping out/i }));
        expect(screen.queryByRole("alert")).toBeInTheDocument();

        const closeButton = screen.getByRole("button", { name: /close/i });
        await user.click(closeButton);
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});
