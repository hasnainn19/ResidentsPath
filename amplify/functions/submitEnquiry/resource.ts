import { defineFunction } from "@aws-amplify/backend"

export const submitEnquiry = defineFunction({
  name: "submitEnquiry",
  entry: "./handler.ts",
  resourceGroupName: "data",
});
