import type { Schema } from "../../data/resource";
import { DepartmentEnum } from "../../../shared/formSchema";
import { getDate, getQueuePositionCount } from "../utils/enquiriesStateTable";

// Handler for getDepartmentQueueStatus query to return the number of waiting tickets for a department
export const handler: Schema["getDepartmentQueueStatus"]["functionHandler"] = async (event) => {
  const { departmentId } = event.arguments;

  if (!DepartmentEnum.safeParse(departmentId).success) {
    throw new Error("A valid departmentId is required");
  }

  const serviceDayQueueKey = `${getDate()}#${departmentId}`;
  const queueCount = await getQueuePositionCount(serviceDayQueueKey);

  return {
    queueCount,
    updatedAtIso: new Date().toISOString(),
  };
};
