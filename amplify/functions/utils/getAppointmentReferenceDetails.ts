import { getAmplifyClient } from "./amplifyClient";
import {
  isBookingReferenceNumber,
  normaliseReferenceNumber,
} from "../../../shared/referenceNumbers";

const client = await getAmplifyClient();

type AppointmentRecord = {
  id: string;
  caseId: string;
  date: string;
  status?: string | null;
  checkedInAt?: string | null;
};

type CaseRecord = {
  id: string;
  referenceNumber: string;
};

export type AppointmentReferenceDetails =
  | {
      found: true;
      referenceNumber: string;
      appointment: AppointmentRecord;
      caseRecord: CaseRecord;
    }
  | {
      found: false;
      errorCode: "INVALID_REFERENCE" | "NOT_FOUND" | "SERVER";
      errorMessage: string;
    };

export async function getAppointmentReferenceDetails(
  referenceNumberInput: string,
  unavailableErrorMessage: string,
): Promise<AppointmentReferenceDetails> {
  const referenceNumber = normaliseReferenceNumber(referenceNumberInput);

  if (!isBookingReferenceNumber(referenceNumber)) {
    return {
      found: false,
      errorCode: "INVALID_REFERENCE",
      errorMessage: "Please enter an appointment reference number in the format APT-ABC234.",
    };
  }

  const appointmentLookup = await client.models.Appointment.listAppointmentByBookingReferenceNumber(
    {
      bookingReferenceNumber: referenceNumber,
    },
  );

  if (appointmentLookup.errors?.length) {
    console.error(
      "getAppointmentReferenceDetails: appointment lookup failed",
      appointmentLookup.errors,
    );
    return {
      found: false,
      errorCode: "SERVER",
      errorMessage: unavailableErrorMessage,
    };
  }

  const appointment = appointmentLookup.data?.[0];

  if (!appointment?.id || !appointment.caseId || typeof appointment.date !== "string") {
    return {
      found: false,
      errorCode: "NOT_FOUND",
      errorMessage: "We could not find an appointment for that reference number.",
    };
  }

  const caseLookup = await client.models.Case.get({
    id: appointment.caseId,
  });

  if (caseLookup.errors?.length) {
    console.error("getAppointmentReferenceDetails: case lookup failed", caseLookup.errors);
    return {
      found: false,
      errorCode: "SERVER",
      errorMessage: unavailableErrorMessage,
    };
  }

  const caseRecord = caseLookup.data;

  if (!caseRecord?.id || typeof caseRecord.referenceNumber !== "string") {
    return {
      found: false,
      errorCode: "SERVER",
      errorMessage: "We could not load that appointment right now.",
    };
  }

  return {
    found: true,
    referenceNumber,
    appointment: {
      id: appointment.id,
      caseId: appointment.caseId,
      date: appointment.date,
      status: appointment.status ?? undefined,
      checkedInAt: appointment.checkedInAt ?? undefined,
    },
    caseRecord: {
      id: caseRecord.id,
      referenceNumber: caseRecord.referenceNumber,
    },
  };
}
