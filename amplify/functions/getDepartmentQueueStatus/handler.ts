import type { Schema } from "../../data/resource";
import { DepartmentEnum } from "../../../shared/formSchema";
import { getDate, getQueuePositionCount } from "../utils/enquiriesStateTable";

// Handler for getDepartmentQueueStatus query to return the number of waiting tickets for a department
export const handler: Schema["getDepartmentQueueStatus"]["functionHandler"] = async (event) => {
  const { departmentName } = event.arguments;

  if (!DepartmentEnum.safeParse(departmentName).success) {
    throw new Error("A valid departmentName is required");
  }

  const serviceDayQueueKey = `${getDate()}#${departmentName}`;
  const queueCount = await getQueuePositionCount(serviceDayQueueKey);

  return {
    queueCount,
    updatedAtIso: new Date().toISOString(),
  };
};
