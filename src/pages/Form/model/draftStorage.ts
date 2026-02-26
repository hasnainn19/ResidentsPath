/**
 * Handles saving/loading the form draft to localStorage.
 */

import type { FormData } from "./formFieldTypes";
import { initialFormData } from "./initialState";

export type FormDraftV1 = {
  version: 1;
  updatedAt: number;
  lastPath: string;
  data: FormData;
};

const KEY = "residentspath.formDraft.v1";

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function sanitiseLoadedFormData(dataRaw: Record<string, unknown>): FormData {
  const out: FormData = { ...initialFormData };

  for (const key of Object.keys(initialFormData) as Array<keyof FormData>) {
    const v = dataRaw[key as unknown as string];
    if (v === undefined) continue;

    const def = initialFormData[key];

    if (typeof def === "string") {
      if (typeof v === "string") (out as any)[key] = v;
      continue;
    }

    if (typeof def === "boolean") {
      if (typeof v === "boolean") (out as any)[key] = v;
      continue;
    }

    if (typeof def === "number") {
      if (typeof v === "number" && Number.isFinite(v)) (out as any)[key] = v;
      continue;
    }
  }

  return out;
}

export function loadDraft(storage: Storage): FormDraftV1 | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return null;
    if ((parsed as any).version !== 1) return null;

    const lastPath =
      typeof (parsed as any).lastPath === "string"
        ? (parsed as any).lastPath
        : "/form/personal-details";
    const updatedAt =
      typeof (parsed as any).updatedAt === "number" ? (parsed as any).updatedAt : Date.now();

    const dataRaw = (parsed as any).data;
    if (!isObject(dataRaw)) return null;

    const data = sanitiseLoadedFormData(dataRaw);

    return { version: 1, updatedAt, lastPath, data };
  } catch {
    return null;
  }
}

export function saveDraft(storage: Storage, data: FormData, lastPath: string) {
  try {
    const draft: FormDraftV1 = {
      version: 1,
      updatedAt: Date.now(),
      lastPath,
      data,
    };
    storage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage errors to avoid crashing when storage is unavailable or restricted
  }
}

export function clearDraft(storage: Storage) {
  try {
    storage.removeItem(KEY);
  } catch {
    // Ignore storage errors to avoid crashing when storage is unavailable or restricted
  }
}
