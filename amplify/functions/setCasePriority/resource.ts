import { defineFunction } from "@aws-amplify/backend";

export const setCasePriority = defineFunction({
  name: "setCasePriority",
  entry: "./handler.ts",
});
