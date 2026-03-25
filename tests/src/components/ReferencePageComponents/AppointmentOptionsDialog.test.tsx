import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AppointmentOptionsDialog from "../../../../src/components/ReferencePageComponents/AppointmentOptionsDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("../../../../src/components/TextToSpeechButton", () => ({
  default: ({ text }: { text: string }) => <span data-testid="tts">{text}</span>,
}));

describe("AppointmentOptionsDialog", () => {
  it("stays closed when there is no appointment reference", () => {
    render(
      <AppointmentOptionsDialog
        appointmentReferenceNumber={null}
        canCheckInAppointments={false}
        isCheckingIn={false}
        isCancelling={false}
        onClose={vi.fn()}
        onCancelAppointment={vi.fn()}
        onCheckInAppointment={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the appointment options with both actions when check-in is allowed", () => {
    render(
      <AppointmentOptionsDialog
        appointmentReferenceNumber="APT-ABC234"
        canCheckInAppointments
        isCheckingIn={false}
        isCancelling={false}
        onClose={vi.fn()}
        onCancelAppointment={vi.fn()}
        onCheckInAppointment={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("appOptions-what APT-ABC234?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "appOptions-cancel" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "landing-check" })).toBeEnabled();
    expect(screen.getByTestId("tts")).toHaveTextContent("APT-ABC234");
  });

  it("shows the cancellation-only state when check-in is not allowed", () => {
    render(
      <AppointmentOptionsDialog
        appointmentReferenceNumber="APT-ABC234"
        canCheckInAppointments={false}
        isCheckingIn={false}
        isCancelling={false}
        onClose={vi.fn()}
        onCancelAppointment={vi.fn()}
        onCheckInAppointment={vi.fn()}
      />,
    );

    expect(screen.getByText("appOptions-ch")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "landing-check" })).not.toBeInTheDocument();
    expect(screen.getByTestId("tts")).toHaveTextContent(
      "Check-in is only available at Hounslow House.",
    );
  });

  it("runs the close callback", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <AppointmentOptionsDialog
        appointmentReferenceNumber="APT-ABC234"
        canCheckInAppointments
        isCheckingIn={false}
        isCancelling={false}
        onClose={onClose}
        onCancelAppointment={vi.fn()}
        onCheckInAppointment={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Close appointment options" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("runs the cancel callback", async () => {
    const onCancelAppointment = vi.fn();
    const user = userEvent.setup();

    render(
      <AppointmentOptionsDialog
        appointmentReferenceNumber="APT-ABC234"
        canCheckInAppointments
        isCheckingIn={false}
        isCancelling={false}
        onClose={vi.fn()}
        onCancelAppointment={onCancelAppointment}
        onCheckInAppointment={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "appOptions-cancel" }));

    expect(onCancelAppointment).toHaveBeenCalledTimes(1);
  });

  it("runs the check-in callback", async () => {
    const onCheckInAppointment = vi.fn();
    const user = userEvent.setup();

    render(
      <AppointmentOptionsDialog
        appointmentReferenceNumber="APT-ABC234"
        canCheckInAppointments
        isCheckingIn={false}
        isCancelling={false}
        onClose={vi.fn()}
        onCancelAppointment={vi.fn()}
        onCheckInAppointment={onCheckInAppointment}
      />,
    );

    await user.click(screen.getByRole("button", { name: "landing-check" }));

    expect(onCheckInAppointment).toHaveBeenCalledTimes(1);
  });

  it("disables the actions while an appointment update is in progress", () => {
    render(
      <AppointmentOptionsDialog
        appointmentReferenceNumber="APT-ABC234"
        canCheckInAppointments
        isCheckingIn={true}
        isCancelling={false}
        onClose={vi.fn()}
        onCancelAppointment={vi.fn()}
        onCheckInAppointment={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Close appointment options" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "appOptions-cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "landing-check" })).toBeDisabled();
  });
});
