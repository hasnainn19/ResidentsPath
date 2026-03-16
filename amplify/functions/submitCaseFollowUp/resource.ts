import { defineFunction } from "@aws-amplify/backend";

export const submitCaseFollowUp = defineFunction({
  name: "submitCaseFollowUp",
  entry: "./handler.ts",
  resourceGroupName: "data",
});
