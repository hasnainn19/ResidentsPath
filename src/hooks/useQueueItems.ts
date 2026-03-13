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

    fetchItems();

    const updateSub = client.models.Ticket.onUpdate().subscribe({ next: fetchItems });
    const createSub = client.models.Ticket.onCreate().subscribe({ next: fetchItems });

    return () => {
      updateSub.unsubscribe();
      createSub.unsubscribe();
    };
  }, [departmentName]);

  return { items, loading };
};

export default useQueueItems;
