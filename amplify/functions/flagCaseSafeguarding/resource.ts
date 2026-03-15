import { defineFunction } from "@aws-amplify/backend";

export const flagCaseSafeguarding = defineFunction({
  name: "flagCaseSafeguarding",
  entry: "./handler.ts",
});
