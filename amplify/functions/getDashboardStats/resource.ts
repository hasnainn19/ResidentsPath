import { defineFunction } from "@aws-amplify/backend";

export const getDashboardStats = defineFunction({
  name: "getDashboardStats",
  entry: "./handler.ts",
});
