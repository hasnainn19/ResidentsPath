import { defineFunction } from "@aws-amplify/backend";

export const getServiceStats = defineFunction({
  name: "getServiceStats",
  entry: "./handler.ts",
});
