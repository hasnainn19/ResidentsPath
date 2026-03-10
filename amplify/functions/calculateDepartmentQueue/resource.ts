import { defineFunction } from "@aws-amplify/backend";

export const calculateDepartmentQueue = defineFunction({
  name: "calculateDepartmentQueue",
  entry: "./handler.ts"
});