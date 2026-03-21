import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";
import { getAppointmentReferenceDetails } from "../utils/getAppointmentReferenceDetails";

type CancelErrorCode = "INVALID_REFERENCE" | "NOT_FOUND" | "INVALID_STATE" | "SERVER";

function errorResponse(errorCode: CancelErrorCode, errorMessage: string) {
  return {
    ok: false as const,
    errorCode,
    errorMessage,
  };
}

const client = await getAmplifyClient();

export const handler: Schema["cancelAppointmentByReference"]["functionHandler"] = async (event) => {
  const appointmentReferenceDetails = await getAppointmentReferenceDetails(
    event.arguments.referenceNumber ?? "",
    "We could not cancel that appointment right now.",
  );

  if (!appointmentReferenceDetails.found) {
    return errorResponse(
      appointmentReferenceDetails.errorCode as CancelErrorCode,
      appointmentReferenceDetails.errorMessage,
    );
  }

  const { appointment, caseRecord, referenceNumber } = appointmentReferenceDetails;

  if (appointment.status === "CANCELLED") {
    return {
      ok: true,
      cancelled: false,
      alreadyCancelled: true,
      referenceNumber: caseRecord.referenceNumber,
      bookingReferenceNumber: referenceNumber,
    };
  }

  if (appointment.status === "COMPLETED" || appointment.status === "NO_SHOW") {
    return {
      ...errorResponse(
        "INVALID_STATE",
        "This appointment can no longer be cancelled.",
      ),
      referenceNumber: caseRecord.referenceNumber,
      bookingReferenceNumber: referenceNumber,
    };
  }

  if (appointment.status === "CONFIRMED") {
    return {
      ...errorResponse(
        "INVALID_STATE",
        "This appointment can no longer be cancelled because it has already been checked in.",
      ),
      referenceNumber: caseRecord.referenceNumber,
      bookingReferenceNumber: referenceNumber,
    };
  }

  const updateResult = await client.models.Appointment.update({
    id: appointment.id,
    status: "CANCELLED",
  });

  if (updateResult.errors?.length) {
    console.error("cancelAppointmentByReference: appointment update failed", updateResult.errors);
    return errorResponse("SERVER", "We could not cancel that appointment right now.");
  }

  return {
    ok: true,
    cancelled: true,
    alreadyCancelled: false,
    referenceNumber: caseRecord.referenceNumber,
    bookingReferenceNumber: referenceNumber,
  };
};
