import type { DynamoDBStreamHandler } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { recalculateDepartmentQueue } from "../utils/recalculateDepartmentQueue";

/**
 * Check if the change in the ticket record should trigger a queue recalculation.
 * We only want to recalculate if:
 * - The status has changed from WAITING to COMPLETED
 * @param newImage 
 * @param oldImage 
 * @returns boolean indicating whether to trigger recalculation
 */
function shouldRecalculate(newImage: Record<string, any>, oldImage: Record<string, any>): boolean {
    const statusChanged =
        oldImage.status === "WAITING" &&
        newImage.status === "COMPLETED";

    return statusChanged;
}
  
/**
 * Trigger recalculations of department queues when tickets are updated from WAITING to COMPLETED.
 * @param event 
 */
export const handler: DynamoDBStreamHandler = async (event) => {
  // We may receive a batch of updates, but we only need to recalculate once per department
  // Use a Set to track which departments need recalculation
  const departmentIds = new Set<string>();

  for (const record of event.Records) {
    if (record.eventName !== "MODIFY") {
      continue;
    }
    if (!record.dynamodb?.NewImage || !record.dynamodb?.OldImage) {
      continue;
    }

    const newImage = unmarshall(record.dynamodb.NewImage as any);
    const oldImage = unmarshall(record.dynamodb.OldImage as any);

    // Only trigger if the status has changed
    if (!shouldRecalculate(newImage, oldImage)) {
      continue;
    }

    const departmentId = newImage.departmentId;
    if (!departmentId) {
      console.error("onTicketCompleted: departmentId is missing in record", record);
      continue;
    }

    departmentIds.add(departmentId);
  }

  for (const departmentId of departmentIds) {
    try {
      await recalculateDepartmentQueue(departmentId);
    } 
    catch (error) {
      console.error(`recalculateDepartmentQueue: failed for department ${departmentId}`, error);
    }
  }
};