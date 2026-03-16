import { defineFunction } from "@aws-amplify/backend";

export const getCaseDetails = defineFunction({
  name: "getCaseDetails",
  entry: "./handler.ts",
});
