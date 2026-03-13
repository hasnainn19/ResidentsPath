import { defineFunction } from "@aws-amplify/backend";

export const cleanupEnquiryState = defineFunction({
  name: "cleanupEnquiryState",
  entry: "./handler.ts",
  resourceGroupName: "data",
});
