import { defineFunction } from "@aws-amplify/backend";

export const getCaseFollowUp = defineFunction({
  name: "getCaseFollowUp",
  entry: "./handler.ts",
});
