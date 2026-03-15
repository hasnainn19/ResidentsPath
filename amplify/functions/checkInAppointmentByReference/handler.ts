import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";
import { getCurrentAppointmentDateTime } from "../../../shared/formSchema";
import { getAppointmentReferenceDetails } from "../utils/getAppointmentReferenceDetails";

type CheckInErrorCode = "INVALID_REFERENCE" | "NOT_FOUND" | "NOT_TODAY" | "INVALID_STATE" | "SERVER";

function errorResponse(errorCode: CheckInErrorCode, errorMessage: string) {
  return {
    ok: false as const,
    errorCode,
    errorMessage,
  };
}

const client = await getAmplifyClient();

export const handler: Schema["checkInAppointmentByReference"]["functionHandler"] = async (event) => {
  const appointmentReferenceDetails = await getAppointmentReferenceDetails(
    event.arguments.referenceNumber ?? "",
    "We could not check in that appointment right now.",
  );

  if (!appointmentReferenceDetails.found) {
    return errorResponse(
      appointmentReferenceDetails.errorCode as CheckInErrorCode,
      appointmentReferenceDetails.errorMessage,
    );
  }

  const { appointment, caseRecord, referenceNumber } = appointmentReferenceDetails;

  if (appointment.status === "CANCELLED" || appointment.status === "COMPLETED" || appointment.status === "NO_SHOW") {
    return {
      ...errorResponse(
        "INVALID_STATE",
        "This appointment cannot be checked in from the reference page.",
      ),
      referenceNumber: caseRecord.referenceNumber,
      bookingReferenceNumber: referenceNumber,
    };
  }

  const currentDate = getCurrentAppointmentDateTime().dateIso;

  if (appointment.date !== currentDate) {
    return {
      ...errorResponse(
        "NOT_TODAY",
        "Appointments can only be checked in on the day of the appointment.",
      ),
      referenceNumber: caseRecord.referenceNumber,
      bookingReferenceNumber: referenceNumber,
    };
  }

  if (appointment.status === "CONFIRMED" && appointment.checkedInAt) {
    return {
      ok: true,
      checkedIn: false,
      alreadyCheckedIn: true,
      referenceNumber: caseRecord.referenceNumber,
      bookingReferenceNumber: referenceNumber,
    };
  }

  const checkedInAt = new Date().toISOString();
  const updateResult = await client.models.Appointment.update({
    id: appointment.id,
    status: "CONFIRMED",
    checkedInAt,
  });

  if (updateResult.errors?.length) {
    console.error("checkInAppointmentByReference: appointment update failed", updateResult.errors);
    return errorResponse("SERVER", "We could not check in that appointment right now.");
  }

  return {
    ok: true,
    checkedIn: true,
    alreadyCheckedIn: false,
    referenceNumber: caseRecord.referenceNumber,
    bookingReferenceNumber: referenceNumber,
  };
};
