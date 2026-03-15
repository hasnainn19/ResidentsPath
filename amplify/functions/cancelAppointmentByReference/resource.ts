import { defineFunction } from "@aws-amplify/backend";

export const cancelAppointmentByReference = defineFunction({
  name: "cancelAppointmentByReference",
  entry: "./handler.ts",
});
