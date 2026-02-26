import { defineFunction } from "@aws-amplify/backend";

export const getDailyTickets = defineFunction({
  name: "getDailyTickets",
  entry: "./handler.ts"
});