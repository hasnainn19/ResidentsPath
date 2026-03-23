import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { initialFormData } from "../../../../src/pages/Form/model/initialState";
import type { FormData } from "../../../../src/pages/Form/model/formFieldTypes";

const {
  mockNavigate,
  mockSetFormData,
  mockLoadDraft,
  mockClearDraft,
  mockFormatSavedTime,
  testState,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSetFormData: vi.fn(),
  mockLoadDraft: vi.fn(),
  mockClearDraft: vi.fn(),
  mockFormatSavedTime: vi.fn(),
  testState: {
    formData: null as FormData | null,
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../../src/context/FormWizardProvider", () => ({
  useFormWizard: () => ({
    formData: testState.formData,
    setFormData: mockSetFormData,
  }),
}));

vi.mock("../../../../src/components/FormPageComponents/FormStepLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock("../../../../src/pages/Form/model/draftStorage", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/pages/Form/model/draftStorage")>(
    "../../../../src/pages/Form/model/draftStorage",
  );

  return {
    ...actual,
    loadDraft: mockLoadDraft,
    clearDraft: mockClearDraft,
    formatSavedTime: mockFormatSavedTime,
  };
});

import FormEntry from "../../../../src/pages/Form/FormEntry";

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
  return render(<FormEntry />);
}

describe("FormEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadDraft.mockReturnValue(null);
    mockFormatSavedTime.mockReturnValue("");
  });

  it("does not show the saved-form button when there is no draft", () => {
    renderPage();

    expect(screen.queryByRole("button", { name: "formentry-continue" })).not.toBeInTheDocument();
  });

  it("clears the draft and resets the form when starting a new enquiry", async () => {
    renderPage({
      firstName: "Existing",
    });
    const user = userEvent.setup();

    await user.click(screen.getAllByRole("button", { name: "formentry-startnew" })[0]);

    expect(mockClearDraft).toHaveBeenCalledWith(localStorage);
    expect(mockSetFormData).toHaveBeenCalledWith(initialFormData);
  });

  it("navigates to enquiry selection when starting a new enquiry", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getAllByRole("button", { name: "formentry-startnew" })[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/form/enquiry-selection");
  });

  it("continues a saved draft from its safe last path", async () => {
    const draft = makeDraft();
    mockLoadDraft.mockReturnValue(draft);
    mockFormatSavedTime.mockReturnValue("21 Mar 2026, 10:45");

    renderPage({
      language: "en",
    });
    const user = userEvent.setup();

    expect(
      screen.getByText(
        "We found a saved form from 21 Mar 2026, 10:45. You can continue it or start again.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "formentry-continue" }));

    expect(mockSetFormData).toHaveBeenCalledWith(draft.data);
    expect(mockNavigate).toHaveBeenCalledWith("/form/actions", { replace: true });
  });

  it("falls back to enquiry selection when the saved draft path is unsafe", async () => {
    const draft = makeDraft({
      lastPath: "/outside-form",
    });
    mockLoadDraft.mockReturnValue(draft);
    mockFormatSavedTime.mockReturnValue("");

    renderPage();
    const user = userEvent.setup();

    expect(
      screen.getByText("We found a saved form on this device. You can continue it or start again."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "formentry-continue" }));

    expect(mockSetFormData).toHaveBeenCalledWith(draft.data);
    expect(mockNavigate).toHaveBeenCalledWith("/form/enquiry-selection", { replace: true });
  });

  it("navigates to the existing case page", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "formentry-existing" }));

    expect(mockNavigate).toHaveBeenCalledWith("/form/existing");
  });
});
