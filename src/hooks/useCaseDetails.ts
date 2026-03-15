import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

interface CaseTicket {
  ticketId: string;
  ticketStatus: string;
}

interface CaseDetails {
  referenceNumber: string;
  departmentId: string | null;
  description: string | null;
  status: string | null;
  priority: boolean | null;
  flag: boolean | null;
  notes: string | null;
  enquiry: string | null;
  otherEnquiryText: string | null;
  childrenCount: string | null;
  householdSize: string | null;
  ageRange: string | null;
  hasDisabilityOrSensory: boolean | null;
  disabilityType: string | null;
  domesticAbuse: boolean | null;
  safeToContact: string | null;
  safeContactNotes: string | null;
  urgent: string | null;
  urgentReason: string | null;
  urgentReasonOtherText: string | null;
  supportNotes: string | null;
  supportNeeds: string[];
  otherSupport: string | null;
  additionalInfo: string | null;
  name: string | null;
  tickets: CaseTicket[];
}

const useCaseDetails = (caseId: string | undefined) => {
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) return;

    const client = generateClient<Schema>({ authMode: "userPool" });

    const fetchDetails = () => {
      setLoading(true);
      client.queries
        .getCaseDetails({ caseId })
        .then((result: any) => {
          const d = result.data;
          if (!d) {
            setError("Case not found");
            return;
          }
          setCaseDetails({
            referenceNumber: d.referenceNumber,
            departmentId: d.departmentId ?? null,
            description: d.description ?? null,
            status: d.status ?? null,
            priority: d.priority ?? null,
            flag: d.flag ?? null,
            notes: d.notes ?? null,
            enquiry: d.enquiry ?? null,
            otherEnquiryText: d.otherEnquiryText ?? null,
            childrenCount: d.childrenCount ?? null,
            householdSize: d.householdSize ?? null,
            ageRange: d.ageRange ?? null,
            hasDisabilityOrSensory: d.hasDisabilityOrSensory ?? null,
            disabilityType: d.disabilityType ?? null,
            domesticAbuse: d.domesticAbuse ?? null,
            safeToContact: d.safeToContact ?? null,
            safeContactNotes: d.safeContactNotes ?? null,
            urgent: d.urgent ?? null,
            urgentReason: d.urgentReason ?? null,
            urgentReasonOtherText: d.urgentReasonOtherText ?? null,
            supportNotes: d.supportNotes ?? null,
            supportNeeds: d.supportNeeds ? JSON.parse(d.supportNeeds) : [],
            otherSupport: d.otherSupport ?? null,
            additionalInfo: d.additionalInfo ?? null,
            name: d.name ?? null,
            tickets: (d.tickets ?? []).map((t: any) => ({
              ticketId: t.ticketId,
              ticketStatus: t.ticketStatus,
            })),
          });
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Failed to load case");
        })
        .finally(() => setLoading(false));
    };

    fetchDetails();

    const caseSub = client.models.Case.onUpdate({
      filter: { id: { eq: caseId } },
    }).subscribe({ next: fetchDetails });

    const ticketUpdateSub = client.models.Ticket.onUpdate().subscribe({
      next: fetchDetails,
    });
    const ticketCreateSub = client.models.Ticket.onCreate().subscribe({
      next: fetchDetails,
    });

    return () => {
      caseSub.unsubscribe();
      ticketUpdateSub.unsubscribe();
      ticketCreateSub.unsubscribe();
    };
  }, [caseId]);

  return { caseDetails, loading, error };
};

export default useCaseDetails;
