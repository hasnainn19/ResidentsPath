import { defineFunction } from "@aws-amplify/backend"

export const toggleNotifications = defineFunction({
  name: "toggleNotifications",
  entry: "./handler.ts",
});
