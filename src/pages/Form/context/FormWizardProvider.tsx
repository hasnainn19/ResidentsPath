import { createContext, useContext, useState, type ReactNode } from "react";
import type { FormData } from "../model/types";
import { initialFormData } from "../model/initialState";

type FormWizardCtx = {
  formData: FormData;
  setFormData: (next: FormData | ((prev: FormData) => FormData)) => void;

  handleSave: () => void;
  handleListenAll: () => void;
};

const Ctx = createContext<FormWizardCtx>({
  formData: initialFormData,
  setFormData: () => {},
  handleSave: () => {},
  handleListenAll: () => {},
});

export function FormWizardProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const handleSave = () => alert("Saved (mock)");
  const handleListenAll = () => alert("Listening all (mock)");

  return <Ctx.Provider value={{ formData, setFormData, handleSave, handleListenAll }}>{children}</Ctx.Provider>;
}

export function useFormWizard() {
  return useContext(Ctx);
}
