import { defineFunction } from "@aws-amplify/backend";

export const getTicketStatus = defineFunction({
    name: "getTicketStatus",
    entry: "./handler.ts"
});