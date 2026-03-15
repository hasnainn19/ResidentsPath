import { useMemo, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { useAuth } from "./useAuth";
import { getDataAuthMode } from "../utils/getDataAuthMode";
import {
  isBookingReferenceNumber,
  normaliseReferenceNumber,
} from "../../shared/referenceNumbers";

type AppointmentActionStatus = {
  severity: "success" | "info" | "warning";
  text: string;
} | null;

export function useAppointmentReferenceActions() {
  const client = useMemo(() => generateClient<Schema>(), []);
  const { isStaff, isHounslowHouseDevice } = useAuth();
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionStatus, setActionStatus] = useState<AppointmentActionStatus>(null);

  async function checkInAppointmentReference(value: string) {
    setActionStatus(null);

    if (isCheckingIn) {
      setActionStatus({
        severity: "warning",
        text: "Check-in in progress, please wait",
      });
      return {
        ok: false,
        errorMessage: "Check-in in progress, please wait",
      };
    }

    const referenceNumber = normaliseReferenceNumber(value);

    if (!isBookingReferenceNumber(referenceNumber)) {
      setActionStatus({
        severity: "warning",
        text: "Enter an appointment reference number in the format APT-ABC234.",
      });
      return {
        ok: false,
        errorMessage: "Enter an appointment reference number in the format APT-ABC234.",
      };
    }

    if (!isStaff && !isHounslowHouseDevice) {
      setActionStatus({
        severity: "warning",
        text: "Appointment check-in is only available at Hounslow House.",
      });
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
        setActionStatus({
          severity: "warning",
          text: "We could not check in that appointment right now.",
        });
        return {
          ok: false,
          errorMessage: "We could not check in that appointment right now.",
        };
      }

      if (response.data?.alreadyCheckedIn) {
        setActionStatus({
          severity: "info",
          text: "This appointment has already been checked in.",
        });
      }

      if (!response.data?.ok) {
        setActionStatus({
          severity: "warning",
          text: response.data?.errorMessage || "We could not check in that appointment right now.",
        });
      }

      return {
        ok: Boolean(response.data?.ok),
        checkedIn: response.data?.checkedIn || undefined,
        alreadyCheckedIn: response.data?.alreadyCheckedIn || undefined,
        errorMessage: response.data?.errorMessage || undefined,
      };
    } catch (error) {
      console.error("Failed to check in appointment", error);
      setActionStatus({
        severity: "warning",
        text: "We could not check in that appointment right now.",
      });
      return {
        ok: false,
        errorMessage: "We could not check in that appointment right now.",
      };
    } finally {
      setIsCheckingIn(false);
    }
  }

  async function cancelAppointmentReference(value: string) {
    setActionStatus(null);

    if (isCancelling) {
      setActionStatus({
        severity: "warning",
        text: "Cancellation in progress, please wait",
      });
      return {
        ok: false,
        errorMessage: "Cancellation in progress, please wait",
      };
    }

    const referenceNumber = normaliseReferenceNumber(value);

    if (!isBookingReferenceNumber(referenceNumber)) {
      setActionStatus({
        severity: "warning",
        text: "Enter an appointment reference number in the format APT-ABC234.",
      });
      return {
        ok: false,
        errorMessage: "Enter an appointment reference number in the format APT-ABC234.",
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
        setActionStatus({
          severity: "warning",
          text: "We could not cancel that appointment right now.",
        });
        return {
          ok: false,
          errorMessage: "We could not cancel that appointment right now.",
        };
      }

      if (response.data?.ok) {
        setActionStatus({
          severity: response.data.alreadyCancelled ? "info" : "success",
          text: response.data.alreadyCancelled
            ? "This appointment has already been cancelled."
            : "Your appointment has been cancelled.",
        });
      } else {
        setActionStatus({
          severity: "warning",
          text: response.data?.errorMessage || "We could not cancel that appointment right now.",
        });
      }

      return {
        ok: Boolean(response.data?.ok),
        errorMessage: response.data?.errorMessage || undefined,
        alreadyCancelled: response.data?.alreadyCancelled || undefined,
      };
    } catch (error) {
      console.error("Failed to cancel appointment", error);
      setActionStatus({
        severity: "warning",
        text: "We could not cancel that appointment right now.",
      });
      return {
        ok: false,
        errorMessage: "We could not cancel that appointment right now.",
      };
    } finally {
      setIsCancelling(false);
    }
  }

  return {
    actionStatus,
    canCheckInAppointments: isStaff || isHounslowHouseDevice,
    clearActionStatus: () => setActionStatus(null),
    isCheckingIn,
    isCancelling,
    checkInAppointmentReference,
    cancelAppointmentReference,
  };
}
