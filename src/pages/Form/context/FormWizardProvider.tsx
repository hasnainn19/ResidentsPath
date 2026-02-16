/**
 * Shared form state for the form.
 *
 * This holds the single FormData object used across all steps of the form.
 * It exposes formData and setFormData so each step can update the same values.
 *
 * It also exposes shared actions used by the UI, such as saving progress.
 */

import { createContext, useContext, useState, type ReactNode } from "react";
import type { FormData } from "../model/types";
import { initialFormData } from "../model/initialState";

type FormWizardCtx = {
  formData: FormData;
  setFormData: (next: FormData | ((prev: FormData) => FormData)) => void;

  handleSave: () => void;
};

const Ctx = createContext<FormWizardCtx>({
  formData: initialFormData,
  setFormData: () => {},
  handleSave: () => {},
});

export function FormWizardProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleSave = () => alert("Saved (mock)");

  return <Ctx.Provider value={{ formData, setFormData, handleSave}}>{children}</Ctx.Provider>;
}

export function useFormWizard() {
  return useContext(Ctx);
}
