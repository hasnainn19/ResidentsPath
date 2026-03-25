import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import type { FormData } from "../../../../src/pages/Form/model/formFieldTypes";
import { initialFormData } from "../../../../src/pages/Form/model/initialState";

const testState = vi.hoisted(() => ({
  formData: null as FormData | null,
}));

vi.mock("../../../../src/context/FormWizardProvider", () => ({
  useFormWizard: () => ({
    formData: testState.formData,
  }),
}));

import RequireFormSteps from "../../../../src/components/FormPageComponents/RequireFormSteps";

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...initialFormData,
    ...overrides,
  };
}

function renderGuard(
  step: "personal-details" | "enquiry-selection" | "actions" | "review-and-submit",
) {
  return render(
    <MemoryRouter initialEntries={[`/form/${step}`]}>
      <Routes>
        {step !== "personal-details" ? (
          <Route path="/form/personal-details" element={<div>Personal details page</div>} />
        ) : null}
        {step !== "enquiry-selection" ? (
          <Route path="/form/enquiry-selection" element={<div>Enquiry selection page</div>} />
        ) : null}
        {step !== "actions" ? (
          <Route path="/form/actions" element={<div>Actions page</div>} />
        ) : null}
        {step !== "review-and-submit" ? (
          <Route path="/form/review-and-submit" element={<div>Review page</div>} />
        ) : null}
        <Route
          path={`/form/${step}`}
          element={
            <RequireFormSteps step={step}>
              <div>Protected content</div>
            </RequireFormSteps>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireFormSteps", () => {
  it("renders the requested step when it is allowed", () => {
    testState.formData = makeFormData({
      firstName: "Test",
      lastName: "Tester",
      topLevel: "Housing",
      enquiryId: "homelessness",
      proceed: "JOIN_DIGITAL_QUEUE",
    });

    renderGuard("review-and-submit");

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects back to enquiry selection when step one is incomplete", () => {
    testState.formData = makeFormData({
      firstName: "Test",
      lastName: "Tester",
      topLevel: "Housing",
      enquiryId: "",
      proceed: "",
    });

    renderGuard("actions");

    expect(screen.getByText("Enquiry selection page")).toBeInTheDocument();
  });

  it("redirects back to actions when an appointment path has no confirmed slot", () => {
    testState.formData = makeFormData({
      firstName: "Test",
      lastName: "Tester",
      topLevel: "Housing",
      enquiryId: "homelessness",
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "",
      appointmentTime: "",
    });

    renderGuard("review-and-submit");

    expect(screen.getByText("Actions page")).toBeInTheDocument();
  });

  it("allows the review step when a booking path already has a confirmed slot", () => {
    testState.formData = makeFormData({
      firstName: "Test",
      lastName: "Tester",
      topLevel: "Housing",
      enquiryId: "homelessness",
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2026-03-24",
      appointmentTime: "10:00",
    });

    renderGuard("review-and-submit");

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects back to personal details when the required names are missing", () => {
    testState.formData = makeFormData({
      topLevel: "Housing",
      enquiryId: "homelessness",
      proceed: "JOIN_DIGITAL_QUEUE",
      firstName: "",
      lastName: "",
    });

    renderGuard("actions");

    expect(screen.getByText("Personal details page")).toBeInTheDocument();
  });
});
