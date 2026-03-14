import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { useAuth } from "./useAuth";
import { getDataAuthMode } from "../utils/getDataAuthMode";
import {
  isBookingReferenceNumber,
  normaliseReferenceNumber,
} from "../../shared/referenceNumbers";

export function useAppointmentReferenceActions() {
  const client = useMemo(() => generateClient<Schema>(), []);
  const { isStaff, isHounslowHouseDevice } = useAuth();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  async function checkInAppointmentReference(value: string) {
    if (isCheckingIn) {
      return {
        ok: false,
        errorMessage: "We are already checking in that appointment.",
      };
    }

    const referenceNumber = normaliseReferenceNumber(value);

    if (!isBookingReferenceNumber(referenceNumber)) {
      return {
        ok: false,
        errorMessage: "Enter an appointment reference number in the format APT-ABC123.",
      };
    }

    if (!isStaff && !isHounslowHouseDevice) {
      return {
        ok: false,
        errorMessage: "Appointment check-in is only available at Hounslow House.",
      };
    }

    setIsCheckingIn(true);

    try {
      const authMode = await getDataAuthMode();
      const response = await client.mutations.checkInAppointmentByReference(
        { referenceNumber },
        { authMode },
      );

      if (response.errors?.length) {
        console.error("checkInAppointmentByReference returned errors", response.errors);
        return {
          ok: false,
          errorMessage: "We could not check in that appointment right now.",
        };
      }

      return {
        ok: Boolean(response.data?.ok),
        checkedIn: response.data?.checkedIn || undefined,
        alreadyCheckedIn: response.data?.alreadyCheckedIn || undefined,
        errorMessage: response.data?.errorMessage || undefined,
      };
    } catch (error) {
      console.error("Failed to check in appointment", error);
      return {
        ok: false,
        errorMessage: "We could not check in that appointment right now.",
      };
    } finally {
      setIsCheckingIn(false);
    }
  }

  async function cancelAppointmentReference(value: string) {
    if (isCancelling) {
      return {
        ok: false,
        errorMessage: "This appointment is already being cancelled.",
      };
    }

    const referenceNumber = normaliseReferenceNumber(value);

    if (!isBookingReferenceNumber(referenceNumber)) {
      return {
        ok: false,
        errorMessage: "Enter an appointment reference number in the format APT-ABC123.",
      };
    }

    setIsCancelling(true);

    try {
      const authMode = await getDataAuthMode();
      const response = await client.mutations.cancelAppointmentByReference(
        { referenceNumber },
        { authMode },
      );

      if (response.errors?.length) {
        console.error("cancelAppointmentByReference returned errors", response.errors);
        return {
          ok: false,
          errorMessage: "We could not cancel that appointment right now.",
        };
      }

      return {
        ok: Boolean(response.data?.ok),
        errorMessage: response.data?.errorMessage || undefined,
        alreadyCancelled: response.data?.alreadyCancelled || undefined,
      };
    } catch (error) {
      console.error("Failed to cancel appointment", error);
      return {
        ok: false,
        errorMessage: "We could not cancel that appointment right now.",
      };
    } finally {
      setIsCancelling(false);
    }
  }

  return {
    canCheckInAppointments: isStaff || isHounslowHouseDevice,
    isCheckingIn,
    isCancelling,
    checkInAppointmentReference,
    cancelAppointmentReference,
  };
}
