import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

export interface QueueItem {
  ticketId: string;
  ticketNumber: string;
  department: string;
  title: string;
  description: string;
  priority: boolean;
  position: number;
}

const client = generateClient<Schema>({ authMode: "userPool" });

const useQueueItems = (departmentName: string) => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let createSub: { unsubscribe: () => void } | null = null;
    let updateSub: { unsubscribe: () => void } | null = null;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data } = await client.queries.getQueueItems(
          departmentName ? { departmentName } : {},
        );
        setItems(
          (data ?? []).filter((d): d is QueueItem => d != null),
        );
      } catch (e) {
        console.error("useQueueItems: failed to fetch", e);
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await fetchItems();

      // Resolve departmentId so subscriptions only fire for this department
      let filter: { departmentId: { eq: string } } | undefined;
      if (departmentName) {
        const { data: depts } = await client.models.Department.list({
          filter: { name: { eq: departmentName } },
        });
        const departmentId = depts[0]?.id;
        if (departmentId) filter = { departmentId: { eq: departmentId } };
      }

      createSub = client.models.Ticket.onCreate({ filter }).subscribe({ next: fetchItems });
      updateSub = client.models.Ticket.onUpdate({ filter }).subscribe({ next: fetchItems });
    };

    init();

    return () => {
      createSub?.unsubscribe();
      updateSub?.unsubscribe();
    };
  }, [departmentName]);

  return { items, loading };
};

export default useQueueItems;
