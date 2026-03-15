import { defineFunction } from "@aws-amplify/backend";

export const adjustQueuePosition = defineFunction({
  name: "adjustQueuePosition",
  entry: "./handler.ts",
});
