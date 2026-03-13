import { defineFunction } from "@aws-amplify/backend";

export const checkTicketNumber = defineFunction({
    name: "checkTicketNumber",
    entry: "./handler.ts"
});