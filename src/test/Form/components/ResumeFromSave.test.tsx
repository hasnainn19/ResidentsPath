import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import type { FormData } from "../../../pages/Form/model/formFieldTypes";
import { initialFormData } from "../../../pages/Form/model/initialState";

const { mockSetFormData, mockLoadDraft, mockClearDraft, mockFormatSavedTime, testState } =
  vi.hoisted(() => ({
    mockSetFormData: vi.fn(),
    mockLoadDraft: vi.fn(),
    mockClearDraft: vi.fn(),
    mockFormatSavedTime: vi.fn(),
    testState: {
      formData: null as FormData | null,
    },
  }));

vi.mock("../../../context/FormWizardProvider", () => ({
  useFormWizard: () => ({
    formData: testState.formData,
    setFormData: mockSetFormData,
  }),
}));

vi.mock("../../../components/FormPageComponents/FormStepLayout", () => ({
  default: ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle?: string;
    children: ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </section>
  ),
}));

vi.mock("../../../pages/Form/model/draftStorage", async () => {
  const actual = await vi.importActual<typeof import("../../../pages/Form/model/draftStorage")>(
    "../../../pages/Form/model/draftStorage",
  );

  return {
    ...actual,
    loadDraft: mockLoadDraft,
    clearDraft: mockClearDraft,
    formatSavedTime: mockFormatSavedTime,
  };
});

import ResumeFromSave from "../../../components/FormPageComponents/ResumeFromSave";

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...initialFormData,
    ...overrides,
  };
}

function makeDraft(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    updatedAt: 1111111111111,
    lastPath: "/form/actions",
    data: makeFormData({
      language: "cy",
      firstName: "Test",
      enquiryId: "homelessness",
      proceed: "BOOK_APPOINTMENT",
    }),
    ...overrides,
  };
}

function renderPage(formData: Partial<FormData> = {}) {
  testState.formData = makeFormData(formData);

  return render(
    <MemoryRouter initialEntries={["/resume"]}>
      <Routes>
        <Route path="/resume" element={<ResumeFromSave />} />
        <Route path="/form/enquiry-selection" element={<div>Enquiry selection page</div>} />
        <Route path="/form/actions" element={<div>Actions page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResumeFromSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadDraft.mockReturnValue(null);
    mockFormatSavedTime.mockReturnValue("");
  });

  it("redirects to enquiry selection when there is no saved draft", () => {
    renderPage();

    expect(screen.getByText("Enquiry selection page")).toBeInTheDocument();
  });

  it("continues a saved draft from its safe last path", async () => {
    const draft = makeDraft();
    mockLoadDraft.mockReturnValue(draft);
    mockFormatSavedTime.mockReturnValue("21 Mar 2026, 10:45");

    renderPage({
      language: "en",
    });
    const user = userEvent.setup();

    expect(screen.getByText("We found a saved form from 21 Mar 2026, 10:45.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue saved form" }));

    expect(mockSetFormData).toHaveBeenCalledWith(draft.data);
    expect(screen.getByText("Actions page")).toBeInTheDocument();
  });

  it("falls back to enquiry selection when the saved draft path is unsafe", async () => {
    const draft = makeDraft({
      lastPath: "/outside-form",
    });
    mockLoadDraft.mockReturnValue(draft);

    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Continue saved form" }));

    expect(mockSetFormData).toHaveBeenCalledWith(draft.data);
    expect(screen.getByText("Enquiry selection page")).toBeInTheDocument();
  });

  it("clears the draft, preserves the current language, and starts a new form", async () => {
    mockLoadDraft.mockReturnValue(makeDraft());

    renderPage({
      language: "pa",
      firstName: "Existing",
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Start new form" }));

    expect(mockClearDraft).toHaveBeenCalledWith(localStorage);
    expect(mockSetFormData).toHaveBeenCalledWith({
      ...initialFormData,
      language: "pa",
    });
    expect(screen.getByText("Enquiry selection page")).toBeInTheDocument();
  });
});
