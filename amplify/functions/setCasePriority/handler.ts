import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

/**
 * Lambda function to set a case's priority status.
 *
 * Accepts a caseId and a priority boolean. Sets the case to Priority (true)
 * or Standard (false).
 *
 * @param event.arguments.caseId   - ID of the case to update
 * @param event.arguments.priority - true for Priority, false for Standard
 * @returns true if the update was successful
 */

const client = await getAmplifyClient();

export const handler: Schema["setCasePriority"]["functionHandler"] = async (
  event,
) => {
  const { caseId, priority } = event.arguments;

  if (!caseId || priority == null) {
    throw new Error("caseId and priority are required");
  }

  try {
    await client.models.Case.update({ id: caseId, priority });
  } catch (error) {
    throw new Error(
      `Failed to update the priority level of case:${caseId} to ${priority}`,
    );
  }

  return true;
};
