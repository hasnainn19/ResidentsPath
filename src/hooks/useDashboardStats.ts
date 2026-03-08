import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

interface StaffDashboardStats {
  waitingCount: number;
  steppedOutCount: number;
  staffCount: number;
  urgentCount: number;
  longestWaitTime: number;
}

const useDashboardStats = () => {
  const [dashboardStats, setDashboardStats] = useState<StaffDashboardStats>({
    waitingCount: 0,
    steppedOutCount: 0,
    staffCount: 0,
    urgentCount: 0,
    longestWaitTime: 0,
  });

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" });

    const fetchStats = () => {
      client.queries.getDashboardStats({}).then((data) => {
        setDashboardStats({
          waitingCount: data.data?.waitingCount,
          steppedOutCount: data.data?.steppedOutCount,
          staffCount: data.data?.staffCount,
          urgentCount: data.data?.urgentCount,
          longestWaitTime: data.data?.longestWaitTime,
        });
      });
    };

    fetchStats();

    const createSub = client.models.Ticket.onCreate().subscribe({
      next: fetchStats,
    });
    const updateSub = client.models.Ticket.onUpdate().subscribe({
      next: fetchStats,
    });
    const deleteSub = client.models.Ticket.onDelete().subscribe({
      next: fetchStats,
    });

    return () => {
      createSub.unsubscribe();
      updateSub.unsubscribe();
      deleteSub.unsubscribe();
    };
  }, []);

  return dashboardStats;
};

export default useDashboardStats;
