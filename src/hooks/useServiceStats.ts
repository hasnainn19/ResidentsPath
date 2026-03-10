import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

interface ServiceStats {
  serviceName: string;
  waitingCount: number;
  longestWait: number;
  priorityCaseCount: number;
  standardCaseCount: number;
  steppedOutCount: number;
  availableStaff: number;
}

const useServiceStats = () => {
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" });

    const fetchStats = () => {
      client.queries.getServiceStats({}).then((data) => {
        const seen = new Set<string>();
        const result = (data.data ?? [])
          .filter((d) => d != null)
          .map((d) => ({
            serviceName: d.serviceName,
            waitingCount: d.waitingCount,
            longestWait: d.longestWait,
            priorityCaseCount: d.priorityCaseCount,
            standardCaseCount: d.standardCaseCount,
            steppedOutCount: d.steppedOutCount,
            availableStaff: d.availableStaff,
          }))
          .filter((d) => {
            if (seen.has(d.serviceName)) return false;
            seen.add(d.serviceName);
            return true;
          });
        setServiceStats(result);
      });
    };

    fetchStats();

    const ticketCreateSub = client.models.Ticket.onCreate().subscribe({
      next: fetchStats,
    });
    const ticketUpdateSub = client.models.Ticket.onUpdate().subscribe({
      next: fetchStats,
    });
    const ticketDeleteSub = client.models.Ticket.onDelete().subscribe({
      next: fetchStats,
    });

    const staffCreateSub = client.models.Staff.onCreate().subscribe({
      next: fetchStats,
    });
    const staffUpdateSub = client.models.Staff.onUpdate().subscribe({
      next: fetchStats,
    });
    const staffDeleteSub = client.models.Staff.onDelete().subscribe({
      next: fetchStats,
    });

    return () => {
      ticketCreateSub.unsubscribe();
      ticketUpdateSub.unsubscribe();
      ticketDeleteSub.unsubscribe();
      staffCreateSub.unsubscribe();
      staffUpdateSub.unsubscribe();
      staffDeleteSub.unsubscribe();
    };
  }, []);

  return serviceStats;
};

export default useServiceStats;
