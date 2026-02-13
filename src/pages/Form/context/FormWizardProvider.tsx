import { createContext, useContext, useState, type ReactNode } from "react";
import type { FormData } from "../model/types";
import { initialFormData } from "../model/initialState";

type FormWizardCtx = {
  formData: FormData;
  setFormData: (next: FormData | ((prev: FormData) => FormData)) => void;
};

const Ctx = createContext<FormWizardCtx>({
  formData: initialFormData,
  setFormData: () => {},
});

export function FormWizardProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);

  return <Ctx.Provider value={{ formData, setFormData }}>{children}</Ctx.Provider>;
}

export function useFormWizard() {
  return useContext(Ctx);
}
