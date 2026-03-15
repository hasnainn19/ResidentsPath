import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

export interface QueueItem {
  ticketId: string;
  caseId: string;
  ticketNumber: string;
  department: string;
  title: string;
  description: string;
  priority: boolean;
  flag: boolean;
  position: number;
  notes: string | null;
}

const client = generateClient<Schema>({ authMode: "userPool" });

const useQueueItems = (departmentName: string) => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let createSub: { unsubscribe: () => void } | null = null;
    let updateSub: { unsubscribe: () => void } | null = null;
    let deleteSub: { unsubscribe: () => void } | null = null;
    let caseUpdateSub: { unsubscribe: () => void } | null = null;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data } = await client.queries.getQueueItems(
          departmentName ? { departmentName } : {},
        );
        setItems((data ?? []).filter((d): d is QueueItem => d != null));
        setError(null);
      } catch (e) {
        console.error("useQueueItems: failed to fetch", e);
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await fetchItems();

      // Resolve departmentId so ticket subscriptions only fire for this department
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
      deleteSub = client.models.Ticket.onDelete({ filter }).subscribe({ next: fetchItems });
      // Case updates (priority, safeguarding flag) don't touch Ticket, so subscribe separately
      caseUpdateSub = client.models.Case.onUpdate().subscribe({ next: fetchItems });
    };

    init().catch(console.error);

    return () => {
      createSub?.unsubscribe();
      updateSub?.unsubscribe();
      deleteSub?.unsubscribe();
      caseUpdateSub?.unsubscribe();
    };
  }, [departmentName]);

  return { items, loading, error };
};

export default useQueueItems;
