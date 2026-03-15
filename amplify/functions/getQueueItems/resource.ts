import { defineFunction } from "@aws-amplify/backend";

export const getQueueItems = defineFunction({
  name: "getQueueItems",
  entry: "./handler.ts",
});
