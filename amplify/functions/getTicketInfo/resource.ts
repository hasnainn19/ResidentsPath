import { defineFunction } from "@aws-amplify/backend";

export const getTicketInfo = defineFunction({
  name: "getTicketInfo",
  entry: "./handler.ts"
});