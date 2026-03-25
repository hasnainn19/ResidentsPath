import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReceiptBody from "../../../../src/components/SubmissionReceiptComponents/ReceiptBody";

describe("ReceiptBody", () => {
  it("shows the appointment-specific reminder text", () => {
    render(
      <ReceiptBody
        receipt={{
          bookingReferenceNumber: "APT-XYZ234",
          appointmentTime: "10:00",
        }}
        isAppointment
        appointmentDate="24 March 2026"
        submittedAt="23 March 2026, 10:00 AM"
        qrCodeUrl={null}
        onCopyTicket={() => undefined}
        onCheckQueueStatus={() => undefined}
        onCopyAppointmentDetails={() => undefined}
      />,
    );

    expect(
      screen.getByText(
        "Make sure you keep your appointment reference number and case reference number.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the queue-specific reminder text when a ticket exists", () => {
    render(
      <ReceiptBody
        receipt={{
          ticketNumber: "A012",
        }}
        isAppointment={false}
        appointmentDate=""
        submittedAt="23 March 2026, 10:00 AM"
        qrCodeUrl={null}
        onCopyTicket={() => undefined}
        onCheckQueueStatus={() => undefined}
        onCopyAppointmentDetails={() => undefined}
      />,
    );

    expect(
      screen.getByText("Make sure you keep your case reference number and ticket number."),
    ).toBeInTheDocument();
  });

  it("shows the queue reminder text without ticket wording when no ticket exists", () => {
    render(
      <ReceiptBody
        receipt={{}}
        isAppointment={false}
        appointmentDate=""
        submittedAt="23 March 2026, 10:00 AM"
        qrCodeUrl={null}
        onCopyTicket={() => undefined}
        onCheckQueueStatus={() => undefined}
        onCopyAppointmentDetails={() => undefined}
      />,
    );

    expect(screen.getByText("Make sure you keep your case reference number.")).toBeInTheDocument();
  });
});
