import { defineFunction } from "@aws-amplify/backend"

export const hello = defineFunction({
    name: "hello",
    entry: "./handler.ts"
});