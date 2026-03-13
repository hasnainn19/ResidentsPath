import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

/**
 * Lambda function to set or clear a safeguarding flag on a case.
 *
 * Accepts a caseId and a flagged boolean. Sets Case.flag to the given value,
 * allowing staff to both raise and lower a safeguarding flag.
 *
 * @param event.arguments.caseId  - ID of the case to update
 * @param event.arguments.flagged - true to flag for safeguarding, false to clear
 * @returns true if the update was successful
 */

const client = await getAmplifyClient();

export const handler: Schema["flagCaseSafeguarding"]["functionHandler"] = async (event) => {
  const { caseId, flagged } = event.arguments;

  if (!caseId || flagged == null) {
    throw new Error("caseId and flagged are required");
  }

  const { data: caseRecord } = await client.models.Case.get({ id: caseId });
  if (!caseRecord) {
    throw new Error(`Case ${caseId} not found`);
  }

  await client.models.Case.update({ id: caseId, flag: flagged });

  return true;
};
