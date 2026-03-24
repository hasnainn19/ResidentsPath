import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const { mockGenerateClient, mockGetAvailableAppointmentTimes, mockGetDataAuthMode } = vi.hoisted(
  () => ({
    mockGenerateClient: vi.fn(),
    mockGetAvailableAppointmentTimes: vi.fn(),
    mockGetDataAuthMode: vi.fn(),
  }),
);

vi.mock("aws-amplify/data", () => ({
  generateClient: mockGenerateClient,
}));

vi.mock("../../../utils/getDataAuthMode", () => ({
  getDataAuthMode: mockGetDataAuthMode,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../components/TextToSpeechButton", () => ({
  default: ({ text }: { text: string }) => <span data-testid="tts">{text}</span>,
}));

vi.mock("../../../../shared/formSchema", async () => {
  const actual = await vi.importActual<typeof import("../../../../shared/formSchema")>(
    "../../../../shared/formSchema",
  );

  return {
    ...actual,
    getCurrentAppointmentDateTime: () => ({
      dateIso: "2026-03-23",
      time: "09:00",
    }),
  };
});

import BookingPanel from "../../../components/BookingPanel";

type AvailabilityResponse = {
  data: {
    availableTimes: string[];
  };
  errors: { message: string }[] | undefined;
};

function renderPanel(props: ComponentProps<typeof BookingPanel> = {}) {
  return render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={createTheme()}>
        <BookingPanel {...props} />
      </ThemeProvider>
    </LocalizationProvider>,
  );
}

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function availabilityResponse(
  availableTimes: string[],
  errors: AvailabilityResponse["errors"] = undefined,
): AvailabilityResponse {
  return {
    data: {
      availableTimes,
    },
    errors,
  };
}

describe("BookingPanel", () => {
  beforeAll(() => {
    setMatchMedia(false);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setMatchMedia(false);
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockGenerateClient.mockReturnValue({
      queries: {
        getAvailableAppointmentTimes: mockGetAvailableAppointmentTimes,
      },
    });
    mockGetDataAuthMode.mockResolvedValue("identityPool");
    mockGetAvailableAppointmentTimes.mockResolvedValue(availabilityResponse(["09:30", "10:00"]));
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore?.();
  });

  it("does not fetch availability when there is no department", async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText("Bpanel-no-avai")).toBeInTheDocument();
    });

    expect(mockGetAvailableAppointmentTimes).not.toHaveBeenCalled();
  });

  it("loads and filters available appointment times for the selected date", async () => {
    mockGetAvailableAppointmentTimes.mockResolvedValue(
      availabilityResponse(["09:30", "10:15", "bad", "10:00"]),
    );

    renderPanel({ departmentName: "Homelessness" });

    await waitFor(() => {
      expect(mockGetAvailableAppointmentTimes).toHaveBeenCalledWith(
        { departmentName: "Homelessness", dateIso: "2026-03-23" },
        { authMode: "identityPool" },
      );
    });

    expect(await screen.findByText("09:30")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.queryByText("10:15")).not.toBeInTheDocument();
    expect(screen.queryByText("bad")).not.toBeInTheDocument();
  });

  it("shows an error when the availability query returns GraphQL errors", async () => {
    mockGetAvailableAppointmentTimes.mockResolvedValue(
      availabilityResponse(["09:30"], [{ message: "boom" }]),
    );

    renderPanel({ departmentName: "Homelessness" });

    expect(await screen.findByText("Bpanel-unable")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to load available appointment times right now."),
    ).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("shows an error when loading availability throws", async () => {
    mockGetAvailableAppointmentTimes.mockRejectedValue(new Error("boom"));

    renderPanel({ departmentName: "Homelessness" });

    expect(await screen.findByText("Bpanel-unable")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to load available appointment times right now."),
    ).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });

  it("confirms a selected appointment and shows the confirmation dialog", async () => {
    const onConfirm = vi.fn();
    renderPanel({ departmentName: "Homelessness", onConfirm });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "09:30" }));
    await user.click(screen.getByRole("button", { name: "Bpanel-confirm" }));

    expect(onConfirm).toHaveBeenCalledWith("2026-03-23", "09:30");
    expect(await screen.findByText("Bpanel-app")).toBeInTheDocument();
    expect(screen.getByText("23 March 2026 Bpanel-at 09:30")).toBeInTheDocument();
  });

  it("clears a selected time when the refreshed availability no longer includes it", async () => {
    mockGetAvailableAppointmentTimes
      .mockResolvedValueOnce(availabilityResponse(["09:30", "10:00"]))
      .mockResolvedValueOnce(availabilityResponse(["10:00"]));

    const user = userEvent.setup();
    const view = renderPanel({ departmentName: "Homelessness" });

    await user.click(await screen.findByRole("button", { name: "09:30" }));

    view.rerender(
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={createTheme()}>
          <BookingPanel departmentName="Adults_Duty" />
        </ThemeProvider>
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(mockGetAvailableAppointmentTimes).toHaveBeenLastCalledWith(
        { departmentName: "Adults_Duty", dateIso: "2026-03-23" },
        { authMode: "identityPool" },
      );
    });

    expect(await screen.findByText("--:--")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bpanel-confirm" })).toBeDisabled();
  });

  it("clears the selected time when the desktop date changes", async () => {
    mockGetAvailableAppointmentTimes
      .mockResolvedValueOnce(availabilityResponse(["09:30", "10:00"]))
      .mockResolvedValueOnce(availabilityResponse(["11:00"]));

    const user = userEvent.setup();
    renderPanel({ departmentName: "Homelessness" });

    await user.click(await screen.findByRole("button", { name: "09:30" }));
    await user.click(screen.getByText("24"));

    await waitFor(() => {
      expect(mockGetAvailableAppointmentTimes).toHaveBeenLastCalledWith(
        { departmentName: "Homelessness", dateIso: "2026-03-24" },
        { authMode: "identityPool" },
      );
    });

    expect(await screen.findByText("--:--")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bpanel-confirm" })).toBeDisabled();
  });

  it("clears the selected time when the mobile date changes", async () => {
    setMatchMedia(true);

    mockGetAvailableAppointmentTimes
      .mockResolvedValueOnce(availabilityResponse(["09:30", "10:00"]))
      .mockResolvedValueOnce(availabilityResponse(["11:00"]));

    const user = userEvent.setup();
    renderPanel({ departmentName: "Homelessness" });

    await user.click(await screen.findByRole("button", { name: "09:30" }));
    await user.click(screen.getByText("24"));

    await waitFor(() => {
      expect(mockGetAvailableAppointmentTimes).toHaveBeenLastCalledWith(
        { departmentName: "Homelessness", dateIso: "2026-03-24" },
        { authMode: "identityPool" },
      );
    });

    expect(await screen.findByText("--:--")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bpanel-confirm" })).toBeDisabled();
  });

  it("closes the confirmation dialog from the OK button and the dialog close handler", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    renderPanel({ departmentName: "Homelessness", onConfirm });

    await user.click(await screen.findByRole("button", { name: "09:30" }));
    await user.click(screen.getByRole("button", { name: "Bpanel-confirm" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Bpanel-ok" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Bpanel-confirm" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("clears the selected appointment time with the clear button", async () => {
    const user = userEvent.setup();

    renderPanel({ departmentName: "Homelessness" });

    await user.click(await screen.findByRole("button", { name: "09:30" }));
    expect(screen.getByRole("button", { name: "Bpanel-confirm" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Bpanel-clear" }));

    expect(await screen.findByText("--:--")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bpanel-confirm" })).toBeDisabled();
  });

  it("ignores a successful availability response after the panel is unmounted", async () => {
    let resolveAvailability: ((value: AvailabilityResponse) => void) | undefined;
    const availabilityRequest = new Promise<AvailabilityResponse>((resolve) => {
      resolveAvailability = resolve;
    });

    mockGetAvailableAppointmentTimes.mockReturnValue(availabilityRequest);

    const view = renderPanel({ departmentName: "Homelessness" });

    await waitFor(() => {
      expect(mockGetAvailableAppointmentTimes).toHaveBeenCalledTimes(1);
    });

    view.unmount();

    await act(async () => {
      resolveAvailability?.(availabilityResponse(["09:30"]));
      await Promise.resolve();
    });

    expect(screen.queryByText("09:30")).not.toBeInTheDocument();
  });

  it("ignores an availability error after the panel is unmounted", async () => {
    let rejectAvailability: ((reason?: unknown) => void) | undefined;
    const availabilityRequest = new Promise<AvailabilityResponse>((_, reject) => {
      rejectAvailability = reject;
    });

    mockGetAvailableAppointmentTimes.mockReturnValue(availabilityRequest);

    const view = renderPanel({ departmentName: "Homelessness" });

    await waitFor(() => {
      expect(mockGetAvailableAppointmentTimes).toHaveBeenCalledTimes(1);
    });

    view.unmount();

    await act(async () => {
      rejectAvailability?.(new Error("boom"));
      await Promise.resolve();
    });

    expect(
      screen.queryByText("Unable to load available appointment times right now."),
    ).not.toBeInTheDocument();
  });
});
