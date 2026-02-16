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
