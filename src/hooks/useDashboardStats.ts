import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

interface StaffDashboardStats {
  waitingCount: number;
  steppedOutCount: number;
  staffCount: number;
  priorityCount: number;
}

const useDashboardStats = () => {
  const [dashboardStats, setDashboardStats] = useState<StaffDashboardStats>({
    waitingCount: 0,
    steppedOutCount: 0,
    staffCount: 0,
    priorityCount: 0,
  });

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" });

    const fetchStats = () => {
      client.queries.getDashboardStats({}).then((data: any) => {
        setDashboardStats({
          waitingCount: data.data?.waitingCount ?? 0,
          steppedOutCount: data.data?.steppedOutCount ?? 0,
          staffCount: data.data?.staffCount ?? 0,
          priorityCount: data.data?.priorityCount ?? 0,
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
