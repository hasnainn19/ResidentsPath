import { defineFunction } from "@aws-amplify/backend";

export const getDepartmentEstimatedTime = defineFunction({
  name: "getDepartmentEstimatedTime",
  entry: "./handler.ts"
});