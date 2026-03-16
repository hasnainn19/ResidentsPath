import type { DynamoDBStreamHandler, DynamoDBRecord } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { recalculateDepartmentQueue } from "../utils/recalculateDepartmentQueue";

/**
 * Check if the change in the ticket record should trigger a queue recalculation.
 * We only want to recalculate if:
 * - The status has changed from WAITING to COMPLETED
 * - A new ticket is created with status WAITING (INSERT event)
 * 
 * @param record - The raw DynamoDB stream record to evaluate
 * @param newImage - The unmarshalled new image of the record, if available
 * @param oldImage - The unmarshalled old image of the record, if available
 * @returns boolean indicating whether to trigger recalculation
 */
function shouldRecalculate(record: DynamoDBRecord, newImage?: Record<string, any>, oldImage?: Record<string, any>): boolean {
  if (!newImage) {
    return false;
  }

  switch (record.eventName) {
      case "INSERT":
        // On new ticket creation (no old image to compare)
        return newImage.status === "WAITING";

      case "MODIFY":
        if (!oldImage) {
          return false;
        }

        return oldImage.status === "WAITING" &&
            newImage.status === "COMPLETED";

      default:
          return false;
  }
}
  
/**
 * Trigger recalculations of department queues when tickets are completed or created.
 * For each relevant change, we add the departmentId to a Set to ensure we only 
 * recalculate once per department, then call recalculateDepartmentQueue for each affected department.
 * 
 * @param event 
 */
export const handler: DynamoDBStreamHandler = async (event) => {
  const departmentIds = new Set<string>();

  for (const record of event.Records) {

    const newImage = record.dynamodb?.NewImage ? unmarshall(record.dynamodb.NewImage as any) : undefined;
    const oldImage = record.dynamodb?.OldImage ? unmarshall(record.dynamodb.OldImage as any) : undefined;

    if (!shouldRecalculate(record, newImage, oldImage)) {
      continue;
    }

    const departmentId = newImage!.departmentId;
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