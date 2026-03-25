import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReceiptQrCard from "../../../../src/components/SubmissionReceiptComponents/ReceiptQrCard";

describe("ReceiptQrCard", () => {
  it("shows the appointment QR code when one is available", () => {
    render(<ReceiptQrCard isAppointment qrCodeUrl="data:image/png;base64,abc123" />);

    expect(screen.getByAltText("Receipt QR code")).toHaveAttribute(
      "src",
      "data:image/png;base64,abc123",
    );
  });

  it("shows the queue fallback when no QR code is available", () => {
    render(<ReceiptQrCard isAppointment={false} qrCodeUrl={null} />);
    expect(screen.getByText("QR unavailable")).toBeInTheDocument();
  });
});
