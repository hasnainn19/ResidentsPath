import { defineFunction } from "@aws-amplify/backend";

export const onTicketCompleted = defineFunction({
  name: "onTicketCompleted",
  entry: "./handler.ts",
  resourceGroupName: "data"
});