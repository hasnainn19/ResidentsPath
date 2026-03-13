import { defineFunction } from "@aws-amplify/backend";

export const getSubmissionReceipt = defineFunction({
  name: "getSubmissionReceipt",
  entry: "./handler.ts",
});
