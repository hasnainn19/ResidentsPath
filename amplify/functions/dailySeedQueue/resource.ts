import { defineFunction } from "@aws-amplify/backend";

export const dailySeedQueue = defineFunction({
  name: "dailySeedQueue",
  entry: "./handler.ts",
  resourceGroupName: "data",
  timeoutSeconds: 60,
});
