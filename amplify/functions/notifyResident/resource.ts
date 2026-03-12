import { defineFunction } from "@aws-amplify/backend";

export const notifyResident = defineFunction({
    name: "notifyResident",
    entry: "./handler.ts",
    resourceGroupName: "data",
});