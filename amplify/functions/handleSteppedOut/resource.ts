import { defineFunction } from "@aws-amplify/backend";

export const handleSteppedOut = defineFunction({
  name: "handleSteppedOut",
  entry: "./handler.ts",
});
