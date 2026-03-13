/**
 * This function returns the available appointment times for a given department and date.
 * It checks the enquiries state DynamoDB table for any claimed appointment slots and filters them out from the list of future bookable appointment times.
 */

import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import type { Schema } from "../../data/resource";
import {
  DepartmentEnum,
  getFutureBookableAppointmentTimes,
  isBookableAppointmentTime,
  isValidIsoDate,
} from "../../../shared/formSchema";

const ddb = new DynamoDBClient({});
const BOOKED_APPOINTMENT_SLOT_STATE = "BOOKED";
const PENDING_APPOINTMENT_SLOT_STATE = "PENDING";

function getEnquiriesStateTableName() {
  const tableName = process.env.ENQUIRIES_STATE_TABLE;
  if (!tableName){
    throw new Error("ENQUIRIES_STATE_TABLE is not set");
  }
  return tableName;
}

// Helper function to construct the partition key for appointment slots (useful if name changes in the future)
function getAppointmentSlotPartitionKey(departmentId: string, dateIso: string) {
  return `APPOINTMENT_SLOT#${departmentId}#${dateIso}`;
}

async function queryClaimedAppointmentTimes(departmentId: string, dateIso: string) {
  const tableName = getEnquiriesStateTableName();
  const pk = getAppointmentSlotPartitionKey(departmentId, dateIso);

  const result = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: pk },
      },
      ConsistentRead: true,
      ProjectionExpression: "sk, #status, expiresAt",
      ExpressionAttributeNames: {
        "#status": "status",
      },
    }),
  );
  return result
}

  const times = new Set<string>();

// List all claimed appointment times for a given department and date by querying the enquiries state table
async function listClaimedAppointmentTimes(departmentId: string, dateIso: string) {
  const claimedTimes = await queryClaimedAppointmentTimes(departmentId, dateIso);
  const times = new Set<string>();
  const nowSeconds = Math.floor(Date.now() / 1000);

  // Loop through the results and extract the time from the sort key of each claimed appointment slot
  for (const item of claimedTimes.Items ?? []) {
    const sk = item.sk?.S;
    const status = item.status?.S;
    const expiresAtRaw = item.expiresAt?.N;
    const expiresAt = typeof expiresAtRaw === "string" ? Number(expiresAtRaw) : NaN;

    const isExpired = Number.isFinite(expiresAt) && expiresAt <= nowSeconds;
    const hasAllowedStatus =
      !status ||
      status === BOOKED_APPOINTMENT_SLOT_STATE ||
      status === PENDING_APPOINTMENT_SLOT_STATE;

    if (sk?.startsWith("TIME#") && !isExpired && hasAllowedStatus) {
      const time = sk.slice("TIME#".length);
      if (isBookableAppointmentTime(time)) {
        times.add(time);
      }
    }
  }


  return times;
}

export const handler: Schema["getAvailableAppointmentTimes"]["functionHandler"] = async (event) => {
  const { departmentId, dateIso } = event.arguments;

  // Validate the departmentId and dateIso parameters before proceeding
  if (!DepartmentEnum.safeParse(departmentId).success || !isValidIsoDate(dateIso)) {
    return {
      availableTimes: [],
    };
  }

  const futureTimes = getFutureBookableAppointmentTimes(dateIso);
  if (futureTimes.length === 0) {
    return {
      availableTimes: [],
    };
  }

  const claimedTimes = await listClaimedAppointmentTimes(departmentId, dateIso);

  return {
    availableTimes: futureTimes.filter((time) => !claimedTimes.has(time)),
  };
};
