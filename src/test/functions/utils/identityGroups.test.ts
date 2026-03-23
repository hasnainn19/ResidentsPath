import { describe, it, expect } from "vitest";
import {
  getIdentityGroups,
  getIdentitySub,
  isStaffIdentity,
} from "../../../../amplify/functions/utils/identityGroups";

// -- getIdentityGroups --

describe("getIdentityGroups", () => {
  it("returns empty array when input does not match expected shape", () => {
    expect(getIdentityGroups(null)).toEqual([]);
    expect(getIdentityGroups(undefined)).toEqual([]);
    expect(getIdentityGroups("string")).toEqual([]);
    expect(getIdentityGroups(42)).toEqual([]);
    expect(getIdentityGroups(true)).toEqual([]);
    expect(getIdentityGroups({ groups: "Staff" })).toEqual([]);
    expect(getIdentityGroups({ claims: {} })).toEqual([]);
    expect(getIdentityGroups({ claims: null })).toEqual([]);
  });

  it("returns groups from identity.groups array", () => {
    expect(getIdentityGroups({ groups: ["Staff", "Admin"] })).toEqual(["Staff", "Admin"]);
  });

  it("filters non-string values from identity.groups", () => {
    expect(getIdentityGroups({ groups: ["Staff", 123, null, "Admin", undefined] })).toEqual([
      "Staff",
      "Admin",
    ]);
  });

  it("returns groups from identity.claims cognito:groups array", () => {
    expect(getIdentityGroups({ claims: { "cognito:groups": ["Staff", "Admin"] } })).toEqual([
      "Staff",
      "Admin",
    ]);
  });

  it("filters non-string values from claims cognito:groups", () => {
    expect(getIdentityGroups({ claims: { "cognito:groups": ["Staff", 42, null] } })).toEqual([
      "Staff",
    ]);
  });

  it("returns single-element array when cognito:groups is a string", () => {
    expect(getIdentityGroups({ claims: { "cognito:groups": "Staff" } })).toEqual(["Staff"]);
  });

  it("returns empty array when cognito:groups is empty/whitespace string", () => {
    expect(getIdentityGroups({ claims: { "cognito:groups": "" } })).toEqual([]);
    expect(getIdentityGroups({ claims: { "cognito:groups": "  " } })).toEqual([]);
  });

  it("prefers groups property over claims", () => {
    expect(
      getIdentityGroups({
        groups: ["FromGroups"],
        claims: { "cognito:groups": ["FromClaims"] },
      }),
    ).toEqual(["FromGroups"]);
  });
});

// -- getIdentitySub --

describe("getIdentitySub", () => {
  it("returns null when input does not contain a valid sub", () => {
    expect(getIdentitySub(null)).toBeNull();
    expect(getIdentitySub(undefined)).toBeNull();
    expect(getIdentitySub("string")).toBeNull();
    expect(getIdentitySub(42)).toBeNull();
    expect(getIdentitySub({ sub: "" })).toBeNull();
    expect(getIdentitySub({ sub: 123 })).toBeNull();
    expect(getIdentitySub({ sub: null })).toBeNull();
    expect(getIdentitySub({ sub: undefined })).toBeNull();
    expect(getIdentitySub({})).toBeNull();
  });

  it("returns sub when present and a non-empty string", () => {
    expect(getIdentitySub({ sub: "user-123" })).toBe("user-123");
  });
});

// -- isStaffIdentity --

describe("isStaffIdentity", () => {
  it("returns true when groups include Staff", () => {
    expect(isStaffIdentity({ groups: ["Staff"] })).toBe(true);
    expect(isStaffIdentity({ groups: ["Admin", "Staff"] })).toBe(true);
  });

  it("returns true when claims cognito:groups include Staff", () => {
    expect(isStaffIdentity({ claims: { "cognito:groups": ["Admin", "Staff"] } })).toBe(true);
  });

  it("returns false when groups do not include Staff", () => {
    expect(isStaffIdentity({ groups: ["Admin"] })).toBe(false);
    expect(isStaffIdentity({ groups: [] })).toBe(false);
  });

  it("returns false for null/undefined identity", () => {
    expect(isStaffIdentity(null)).toBe(false);
    expect(isStaffIdentity(undefined)).toBe(false);
  });
});
