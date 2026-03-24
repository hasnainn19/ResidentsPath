import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ReceiptHeaderCard from "../../../components/SubmissionReceiptComponents/ReceiptHeaderCard";

vi.mock("../../../components/TextToSpeechButton", () => ({
  default: ({ text }: { text: string }) => <span data-testid="tts">{text}</span>,
}));

describe("ReceiptHeaderCard", () => {
  it("shows the appointment-specific header actions", async () => {
    const onCopyCaseReference = vi.fn();
    const onCopyAppointmentReference = vi.fn();
    const onPrint = vi.fn();

    render(
      <ReceiptHeaderCard
        chipLabel="Appointment confirmed"
        heading="Appointment receipt"
        introText="Keep these details safe."
        isAppointment
        caseReferenceNumber="ABC-DEF234"
        appointmentReferenceNumber="APT-XYZ234"
        ticketNumber={undefined}
        ttsText="Appointment receipt"
        onCopyCaseReference={onCopyCaseReference}
        onCopyAppointmentReference={onCopyAppointmentReference}
        onPrint={onPrint}
      />,
    );

    const user = userEvent.setup();

    expect(screen.getByTestId("tts")).toBeInTheDocument();
    expect(screen.getByText("APT-XYZ234")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy appointment reference" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Copy case reference number" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Copy appointment reference" }));
    await user.click(screen.getByRole("button", { name: "Copy case reference number" }));
    await user.click(screen.getByRole("button", { name: "Print or save" }));

    expect(onCopyAppointmentReference).toHaveBeenCalledTimes(1);
    expect(onCopyCaseReference).toHaveBeenCalledTimes(1);
    expect(onPrint).toHaveBeenCalledTimes(1);
  });

  it("shows the queue-specific header state", () => {
    render(
      <ReceiptHeaderCard
        chipLabel="Queue joined"
        heading="Queue receipt"
        introText="Keep these details safe."
        isAppointment={false}
        caseReferenceNumber=""
        appointmentReferenceNumber={undefined}
        ticketNumber="A012"
        ttsText={undefined}
        onCopyCaseReference={vi.fn()}
        onCopyAppointmentReference={vi.fn()}
        onPrint={vi.fn()}
      />,
    );

    expect(screen.getByText("A012")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy appointment reference" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy case reference number" })).toBeDisabled();
  });
});
