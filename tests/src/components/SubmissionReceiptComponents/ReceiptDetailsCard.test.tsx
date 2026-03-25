import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ReceiptDetailsCard from "../../../../src/components/SubmissionReceiptComponents/ReceiptDetailsCard";

describe("ReceiptDetailsCard", () => {
  it("shows queue details", () => {
    render(
      <ReceiptDetailsCard
        receipt={{
          ticketNumber: "A012",
          departmentName: "Homelessness",
          estimatedWaitTimeLower: 10,
          estimatedWaitTimeUpper: 20,
        }}
        isAppointment={false}
        appointmentDate=""
        submittedAt="23 March 2026, 10:00 AM"
        onCopyTicket={vi.fn()}
        onCheckQueueStatus={vi.fn()}
        onCopyAppointmentDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("A012")).toBeInTheDocument();
    expect(screen.getByText("10 to 20 minutes")).toBeInTheDocument();
  });

  it("runs the queue actions", async () => {
    const onCopyTicket = vi.fn();
    const onCheckQueueStatus = vi.fn();

    render(
      <ReceiptDetailsCard
        receipt={{
          ticketNumber: "A012",
          departmentName: "Homelessness",
          estimatedWaitTimeLower: 10,
          estimatedWaitTimeUpper: 20,
        }}
        isAppointment={false}
        appointmentDate=""
        submittedAt="23 March 2026, 10:00 AM"
        onCopyTicket={onCopyTicket}
        onCheckQueueStatus={onCheckQueueStatus}
        onCopyAppointmentDetails={vi.fn()}
      />,
    );

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Copy ticket number" }));
    await user.click(screen.getByRole("button", { name: "Check queue status" }));

    expect(onCopyTicket).toHaveBeenCalledTimes(1);
    expect(onCheckQueueStatus).toHaveBeenCalledTimes(1);
  });

  it("hides estimated wait time and disables queue actions when no ticket is available", () => {
    render(
      <ReceiptDetailsCard
        receipt={{
          ticketNumber: "",
          estimatedWaitTimeLower: -1,
          estimatedWaitTimeUpper: 20,
        }}
        isAppointment={false}
        appointmentDate=""
        submittedAt=""
        onCopyTicket={vi.fn()}
        onCheckQueueStatus={vi.fn()}
        onCopyAppointmentDetails={vi.fn()}
      />,
    );

    expect(screen.queryByText("Estimated wait time")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy ticket number" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Check queue status" })).toBeDisabled();
  });

  it("shows appointment details", () => {
    render(
      <ReceiptDetailsCard
        receipt={{
          bookingReferenceNumber: "APT-XYZ234",
          appointmentTime: "10:00",
          departmentName: "Homelessness",
        }}
        isAppointment
        appointmentDate="24 March 2026"
        submittedAt="23 March 2026, 10:00 AM"
        onCopyTicket={vi.fn()}
        onCheckQueueStatus={vi.fn()}
        onCopyAppointmentDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("APT-XYZ234")).toBeInTheDocument();
    expect(screen.getByText("24 March 2026")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("copies the appointment information", async () => {
    const onCopyAppointmentDetails = vi.fn();

    render(
      <ReceiptDetailsCard
        receipt={{
          bookingReferenceNumber: "APT-XYZ234",
          appointmentTime: "10:00",
          departmentName: "Homelessness",
        }}
        isAppointment
        appointmentDate="24 March 2026"
        submittedAt="23 March 2026, 10:00 AM"
        onCopyTicket={vi.fn()}
        onCheckQueueStatus={vi.fn()}
        onCopyAppointmentDetails={onCopyAppointmentDetails}
      />,
    );

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Copy appointment details" }));

    expect(onCopyAppointmentDetails).toHaveBeenCalledTimes(1);
  });

  it("shows appointment fallbacks when booking details are missing", () => {
    render(
      <ReceiptDetailsCard
        receipt={{}}
        isAppointment
        appointmentDate=""
        submittedAt=""
        onCopyTicket={vi.fn()}
        onCheckQueueStatus={vi.fn()}
        onCopyAppointmentDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.getAllByText("Not available")).toHaveLength(2);
  });
});
