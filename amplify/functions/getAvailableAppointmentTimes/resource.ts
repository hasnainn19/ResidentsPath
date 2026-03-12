import { defineFunction } from "@aws-amplify/backend";

export const getAvailableAppointmentTimes = defineFunction({
  name: "getAvailableAppointmentTimes",
  entry: "./handler.ts",
});
