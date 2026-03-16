export function getIdentityGroups(identity: unknown): string[] {
  if (!identity || typeof identity !== "object") {
    return [];
  }

  if ("groups" in identity && Array.isArray(identity.groups)) {
    return identity.groups.filter((group): group is string => typeof group === "string");
  }

  if ("claims" in identity && identity.claims && typeof identity.claims === "object") {
    const claimGroups = (identity.claims as Record<string, unknown>)["cognito:groups"];

    if (Array.isArray(claimGroups)) {
      return claimGroups.filter((group): group is string => typeof group === "string");
    }

    if (typeof claimGroups === "string" && claimGroups.trim()) {
      return [claimGroups];
    }
  }

  return [];
}

export function getIdentitySub(identity: unknown): string | null {
  if (
    identity &&
    typeof identity === "object" &&
    "sub" in identity &&
    typeof identity.sub === "string" &&
    identity.sub
  ) {
    return identity.sub;
  }

  return null;
}

export function isStaffIdentity(identity: unknown) {
  return getIdentityGroups(identity).includes("Staff");
}
