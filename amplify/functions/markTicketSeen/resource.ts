import { defineFunction } from "@aws-amplify/backend";

export const markTicketSeen = defineFunction({
  name: "markTicketSeen",
  entry: "./handler.ts",
});
