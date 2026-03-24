import { describe, expect, it, vi } from "vitest";

import {
  clearDraft,
  formatSavedTime,
  getSafeDraftPath,
  loadDraft,
  saveDraft,
} from "../../../../src/pages/Form/model/draftStorage";
import type { FormData } from "../../../../src/pages/Form/model/formFieldTypes";
import { initialFormData } from "../../../../src/pages/Form/model/initialState";

const DRAFT_KEY = "residentspath.formDraft.v1";

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...initialFormData,
    ...overrides,
  };
}

function createStorage(
  initial: Record<string, string> = {},
  options: { throwOnSet?: boolean; throwOnRemove?: boolean } = {},
): Storage {
  const data = { ...initial };

  return {
    get length() {
      return Object.keys(data).length;
    },
    clear() {
      for (const key of Object.keys(data)) {
        delete data[key];
      }
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    key(index) {
      return Object.keys(data)[index] ?? null;
    },
    removeItem(key) {
      if (options.throwOnRemove) {
        throw new Error("remove failed");
      }
      delete data[key];
    },
    setItem(key, value) {
      if (options.throwOnSet) {
        throw new Error("set failed");
      }
      data[key] = value;
    },
  };
}

describe("draftStorage", () => {
  it("returns only safe form paths", () => {
    expect(getSafeDraftPath("/form/actions")).toBe("/form/actions");
    expect(getSafeDraftPath("/admin")).toBe("/form/enquiry-selection");
    expect(getSafeDraftPath(null)).toBe("/form/enquiry-selection");
  });

  it("returns null when there is no saved draft", () => {
    expect(loadDraft(createStorage())).toBeNull();
  });

  it("formats saved timestamps for display", () => {
    expect(formatSavedTime(Date.UTC(2026, 5, 1, 11, 15))).toMatch(/2026/);
  });

  it("returns an empty string when formatting the saved time throws", () => {
    const toLocaleStringSpy = vi.spyOn(Date.prototype, "toLocaleString").mockImplementation(() => {
      throw new Error("format failed");
    });

    try {
      expect(formatSavedTime(Date.UTC(2026, 5, 1, 11, 15))).toBe("");
    } finally {
      toLocaleStringSpy.mockRestore();
    }
  });

  it("saves the draft data and last path", () => {
    const storage = createStorage();
    vi.spyOn(Date, "now").mockReturnValue(123456789);

    try {
      saveDraft(storage, makeFormData({ firstName: "Test" }), "/form/actions");
    } finally {
      vi.mocked(Date.now).mockRestore();
    }

    expect(JSON.parse(storage.getItem(DRAFT_KEY) || "null")).toMatchObject({
      version: 1,
      updatedAt: 123456789,
      lastPath: "/form/actions",
      data: {
        firstName: "Test",
      },
    });
  });

  it("returns null for malformed draft JSON", () => {
    const storage = createStorage({
      [DRAFT_KEY]: "{not valid json",
    });

    expect(loadDraft(storage)).toBeNull();
  });

  it("returns null when the saved draft root value is not an object", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify("not an object"),
    });

    expect(loadDraft(storage)).toBeNull();
  });

  it("returns null for unsupported draft versions", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: -1,
        updatedAt: 123,
        lastPath: "/form/actions",
        data: initialFormData,
      }),
    });

    expect(loadDraft(storage)).toBeNull();
  });

  it("returns null when the saved draft data is not an object", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: 1,
        updatedAt: 123,
        lastPath: "/form/actions",
        data: "bad",
      }),
    });

    expect(loadDraft(storage)).toBeNull();
  });

  it("returns the sanitised form data unchanged when no top-level area was saved", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: 1,
        updatedAt: 123,
        lastPath: "/form/personal-details",
        data: {
          firstName: "Test",
        },
      }),
    });

    expect(loadDraft(storage)?.data).toEqual(
      expect.objectContaining({
        firstName: "Test",
        topLevel: "",
      }),
    );
  });

  it("falls back to the current time when the saved draft timestamp is invalid", () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(987654321);
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: 1,
        updatedAt: "bad",
        lastPath: "/form/actions",
        data: initialFormData,
      }),
    });

    try {
      expect(loadDraft(storage)?.updatedAt).toBe(987654321);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("sanitises invalid top-level values and invalid phone countries when loading drafts", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: 1,
        updatedAt: 123,
        lastPath: "/admin",
        data: {
          ...initialFormData,
          topLevel: "Unknown",
          generalServicesChoice: "choice",
          enquiryId: "bad",
          specificDetailId: "detail",
          routedDepartment: "Adults_Duty",
          phoneCountry: "ZZ",
        },
      }),
    });

    expect(loadDraft(storage)).toEqual({
      version: 1,
      updatedAt: 123,
      lastPath: "/form/enquiry-selection",
      data: expect.objectContaining({
        topLevel: "",
        generalServicesChoice: "",
        enquiryId: "",
        specificDetailId: "",
        routedDepartment: "",
        phoneCountry: "GB",
      }),
    });
  });

  it("auto selects the only enquiry for single option top levels when loading drafts", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: 1,
        updatedAt: 123,
        lastPath: "/form/enquiry-selection",
        data: {
          ...initialFormData,
          topLevel: "CouncilTax",
        },
      }),
    });

    expect(loadDraft(storage)?.data).toEqual(
      expect.objectContaining({
        topLevel: "CouncilTax",
        enquiryId: "council_tax",
        routedDepartment: "Council_Tax_Or_Housing_Benefit",
      }),
    );
  });

  it("clears invalid enquiry selections for multi option top levels when loading drafts", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: 1,
        updatedAt: 123,
        lastPath: "/form/enquiry-selection",
        data: {
          ...initialFormData,
          topLevel: "Housing",
          enquiryId: "bad",
          specificDetailId: "detail",
          routedDepartment: "Adults_Duty",
        },
      }),
    });

    expect(loadDraft(storage)?.data).toEqual(
      expect.objectContaining({
        topLevel: "Housing",
        enquiryId: "",
        specificDetailId: "",
        routedDepartment: "",
      }),
    );
  });

  it("refreshes the routed department for valid enquiry selections when loading drafts", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: 1,
        updatedAt: 123,
        lastPath: "/form/enquiry-selection",
        data: {
          ...initialFormData,
          topLevel: "Housing",
          enquiryId: "homelessness",
          routedDepartment: "",
        },
      }),
    });

    expect(loadDraft(storage)?.data).toEqual(
      expect.objectContaining({
        topLevel: "Housing",
        enquiryId: "homelessness",
        routedDepartment: "Homelessness",
      }),
    );
  });

  it("ignores saved values with the wrong type when loading drafts", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: 1,
        updatedAt: 123,
        lastPath: "/form/enquiry-selection",
        data: {
          ...initialFormData,
          topLevel: "Housing",
          enquiryId: "homelessness",
          firstName: 42,
          hasChildren: "yes",
        },
      }),
    });

    expect(loadDraft(storage)?.data).toEqual(
      expect.objectContaining({
        topLevel: "Housing",
        enquiryId: "homelessness",
        firstName: "",
        hasChildren: false,
      }),
    );
  });

  it("Doesn't throw for errors when saving and clearing drafts", () => {
    expect(() =>
      saveDraft(createStorage({}, { throwOnSet: true }), makeFormData(), "/form/enquiry-selection"),
    ).not.toThrow();
    expect(() => clearDraft(createStorage({}, { throwOnRemove: true }))).not.toThrow();
  });

  it("clears the saved draft from storage", () => {
    const storage = createStorage({
      [DRAFT_KEY]: JSON.stringify({
        version: 1,
        updatedAt: 123,
        lastPath: "/form/actions",
        data: initialFormData,
      }),
    });

    clearDraft(storage);

    expect(storage.getItem(DRAFT_KEY)).toBeNull();
  });
});
