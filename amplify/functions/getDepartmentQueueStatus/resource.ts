import { defineFunction } from "@aws-amplify/backend";

export const getDepartmentQueueStatus = defineFunction({
  name: "getDepartmentQueueStatus",
  entry: "./handler.ts",
});
