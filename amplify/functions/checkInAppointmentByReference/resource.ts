import { defineFunction } from "@aws-amplify/backend";

export const checkInAppointmentByReference = defineFunction({
  name: "checkInAppointmentByReference",
  entry: "./handler.ts",
});
