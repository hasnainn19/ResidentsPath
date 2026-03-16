/**
 * Shared form state for the form.
 *
 * This holds the single FormData object used across all steps of the form.
 * It exposes formData and setFormData so each step can update the same values.
 *
 * It also exposes shared actions used by the UI, such as saving progress.
 */

import { createContext, useContext, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { FormData } from "../pages/Form/model/formFieldTypes";
import { initialFormData } from "../pages/Form/model/initialState";
import { clearDraft, loadDraft, saveDraft } from "../pages/Form/model/draftStorage";

type FormWizardCtx = {
  formData: FormData;
  setFormData: (next: FormData | ((prev: FormData) => FormData)) => void;

  handleSave: () => void;

  clearSavedDraft: () => void;
};

const Ctx = createContext<FormWizardCtx | null>(null);

export function FormWizardProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const nav = useNavigate();

  const [formData, setFormData] = useState<FormData>(() => {
    const draft = loadDraft(localStorage);
    return draft?.data ?? initialFormData;
  });

  const handleSave = () => {
    saveDraft(localStorage, formData, location.pathname);
    nav("/", { replace: true });
  };

  const clearSavedDraft = () => {
    clearDraft(localStorage);
  };

  return (
    <Ctx.Provider value={{ formData, setFormData, handleSave, clearSavedDraft }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFormWizard() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useFormWizard must be used within a FormWizardProvider");
  }
  return ctx;
}
