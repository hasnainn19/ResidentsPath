/**
 * Handles saving/loading the form draft to localStorage.
 */

import type { FormData } from "./formFieldTypes";
import { initialFormData } from "./initialState";
import { ENQUIRIES_BY_TOPLEVEL } from "../data/enquiries";
import { getSupportedPhoneCountry } from "../../../../shared/formSchema";

export type FormDraftV1 = {
  version: 1;
  updatedAt: number;
  lastPath: string;
  data: FormData;
};

const KEY = "residentspath.formDraft.v1";

export function formatSavedTime(ts: number) {
  try {
    return new Date(ts).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function getSafeDraftPath(lastPath: unknown) {
  return typeof lastPath === "string" && lastPath.startsWith("/form/")
    ? lastPath
    : "/form/enquiry-selection";
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function sanitiseLoadedFormData(dataRaw: Record<string, unknown>): FormData {
  const out: FormData = { ...initialFormData };
  const outRecord = out as Record<keyof FormData, unknown>;

  for (const key of Object.keys(initialFormData) as Array<keyof FormData>) {
    const v = dataRaw[key as unknown as string];
    if (v === undefined) continue;

    const def = initialFormData[key];

    if (typeof def === "string") {
      if (typeof v === "string") outRecord[key] = v;
      continue;
    }

    if (typeof def === "boolean") {
      if (typeof v === "boolean") outRecord[key] = v;
      continue;
    }

    if (typeof def === "number") {
      if (typeof v === "number" && Number.isFinite(v)) outRecord[key] = v;
      continue;
    }
  }

  out.phoneCountry = getSupportedPhoneCountry(out.phoneCountry) ?? "GB";

  if (out.topLevel && out.topLevel !== "Other") {
    const options = ENQUIRIES_BY_TOPLEVEL[out.topLevel] || [];
    if (options.length === 1) {
      const only = options[0];
      out.enquiryId = only.value;
      out.routedDepartment = only.department ?? "";
    } else if (out.enquiryId) {
      const match = options.find((x) => x.value === out.enquiryId);
      if (match?.department) {
        out.routedDepartment = match.department;
      } else {
        out.enquiryId = "";
        out.specificDetailId = "";
        out.routedDepartment = "";
      }
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
    const parsedRecord = parsed as Record<string, unknown>;
    if (parsedRecord.version !== 1) return null;

    const lastPath = getSafeDraftPath(parsedRecord.lastPath);
    const updatedAt =
      typeof parsedRecord.updatedAt === "number" ? parsedRecord.updatedAt : Date.now();

    const dataRaw = parsedRecord.data;
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
