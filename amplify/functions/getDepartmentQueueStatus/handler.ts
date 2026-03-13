import type { Schema } from "../../data/resource";
import { DepartmentEnum } from "../../../shared/formSchema";
import { getAmplifyClient } from "../utils/amplifyClient";
import { getDate } from "../utils/enquiriesStateTable";
import { logModelErrors } from "../utils/runCleanup";

const client = await getAmplifyClient();

type TicketListPage = {
  data?: Schema["Ticket"]["type"][] | null;
  errors?: unknown[];
  nextToken?: string | null;
};

async function listWaitingTickets(departmentId: string) {
  const tickets: Schema["Ticket"]["type"][] = [];
  let nextToken: string | null | undefined = null;

  do {
    const response: TicketListPage = await client.models.Ticket.list({
      filter: {
        departmentId: { eq: departmentId },
        status: { eq: "WAITING" },
      },
      nextToken,
    });

    const nextPageToken: string | null | undefined = response.nextToken;

    logModelErrors("getDepartmentQueueStatus: Ticket.list failed", response.errors);

    if (response.errors?.length) {
      throw new Error("Failed to load queue status");
    }

    tickets.push(...(response.data ?? []));
    nextToken = nextPageToken;
  } while (nextToken);

  return tickets;
}

// Handler for getDepartmentQueueStatus query to return the number of waiting tickets for a department
export const handler: Schema["getDepartmentQueueStatus"]["functionHandler"] = async (event) => {
  const { departmentId } = event.arguments;

  if (!DepartmentEnum.safeParse(departmentId).success) {
    throw new Error("A valid departmentId is required");
  }

  const serviceDay = getDate();
  const tickets = await listWaitingTickets(departmentId);

  const queueCount = tickets.reduce((count, ticket) => {
    if (!ticket.createdAt) {
      return count;
    }

    const createdAt = Date.parse(ticket.createdAt);

    if (!Number.isFinite(createdAt)) {
      return count;
    }

    // Only count tickets created on the same service day
    return getDate(new Date(createdAt)) === serviceDay ? count + 1 : count;
  }, 0);

  return {
    queueCount,
    updatedAtIso: new Date().toISOString(),
  };
};
