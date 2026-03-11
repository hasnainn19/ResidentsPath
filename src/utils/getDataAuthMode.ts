import { fetchAuthSession } from "aws-amplify/auth";

export type DataAuthMode = "userPool" | "identityPool";

export async function getDataAuthMode(): Promise<DataAuthMode> {
  const session = await fetchAuthSession();

  if (session.tokens?.idToken) {
    return "userPool";
  }

  return "identityPool";
}
