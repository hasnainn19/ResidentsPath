import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { DEPARTMENTS, type DepartmentName } from "../../shared/formSchema";

export type CaseStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type { DepartmentName };

const VALID_DEPARTMENT_NAMES = new Set(DEPARTMENTS.map((d) => d.name));

export interface CaseSummary {
  id: string;
  title: string;
  referenceNumber: string;
  departmentName: DepartmentName;
  status: CaseStatus | null;
  priority: boolean | null;
  flag: boolean | null;
  enquiry: string;
  description: string | null;
  createdAt: string;
}

export interface CasesFilters {
  status?: CaseStatus | "";
  departmentName?: DepartmentName | "";
}

const useCases = (filters: CasesFilters = {}) => {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" });

    const fetchCases = () => {
      setLoading(true);
      setError(null);

      const filter: Record<string, any> = {};
      if (filters.status) filter.status = { eq: filters.status };
      if (filters.departmentName)
        filter.departmentName = { eq: filters.departmentName };

      client.models.Case.list(
        Object.keys(filter).length > 0 ? { filter } : undefined,
      )
        .then((result) => {
          setCases(
            (result.data ?? []).map((c: any) => ({
              id: c.id,
              referenceNumber: c.referenceNumber,
              title: c.title,
              departmentName: (VALID_DEPARTMENT_NAMES.has(c.departmentName)
                ? c.departmentName
                : "General_Customer_Services") as DepartmentName,
              status: c.status ?? null,
              priority: c.priority ?? null,
              flag: c.flag ?? null,
              enquiry: c.enquiry,
              description: c.description ?? null,
              createdAt: c.createdAt,
            })),
          );
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Failed to load cases");
        })
        .finally(() => setLoading(false));
    };

    fetchCases();

    const createSub = client.models.Case.onCreate().subscribe({
      next: fetchCases,
    });
    const updateSub = client.models.Case.onUpdate().subscribe({
      next: fetchCases,
    });

    return () => {
      createSub.unsubscribe();
      updateSub.unsubscribe();
    };
  }, [filters.status, filters.departmentName]);

  return { cases, loading, error };
};

export default useCases;
