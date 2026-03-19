import { getAmplifyClient } from "./amplifyClient";
import type { Schema } from "../../data/resource";
import { getDefaultEstimatedWaitingTime, getEstimatedWaitTimeBounds } from "./queueWaitTimes";
import { callModel } from "./runCleanup";

const client = await getAmplifyClient();

/**
 * Returns the median value from a sorted array of numbers.
 * Used to calculate the median time from completed tickets.
 * Always called with exactly 5 durations (guaranteed by the completedTickets.length >= 5 check).
 */
function median(values: number[]) {
  values.sort((a, b) => a - b);

  const mid = Math.floor(values.length / 2);

  return values[mid];
}

/**
 * Fetches all tickets for a given department created today.
 *
 * @param departmentName - The ID of the department to fetch tickets for
 * @throws Error if no tickets are found for today
 * @returns An array of tickets for the specified department created today
 */
async function getTodayTickets(departmentName:string){
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const tickets = await callModel(
    client.models.Ticket.list({
        filter: {
            departmentName: { eq: departmentName },
            createdAt: {
                ge: startOfDay.toISOString(),
                le: endOfDay.toISOString()
            }
        }
    }),
    "recalculateDepartmentQueue: Ticket.list failed"
  );

  if (!tickets || tickets.length === 0) {
    throw new Error(`No tickets found for department ${departmentName} for today`);
  }

  return tickets;
}

/**
 * Calculates the median time from the provided completed tickets and
 * updates the department's estimatedWaitingTime in DynamoDB with the result.
 * Only called when completedTickets.length >= 5, so durations always has at least 5 values.
 *
 * @param completedTickets - The most recent completed tickets to calculate the median from
 * @param departmentName - The ID of the department to update
 * @returns The calculated median time in minutes, or 0 if all durations are zero
 */
async function calculateEstTimeWithMedian(completedTickets: Schema["Ticket"]["type"][], departmentName:string)
{
  let estWaitingTime = 0;
  const durations: number[] = [];

  for (const ticket of completedTickets) {

      const start = new Date(ticket.createdAt).getTime();
      const end = new Date(ticket.completedAt!).getTime();

      const minutes = (end - start) / 60000;

      durations.push(minutes);
  }

  const medianTime = median(durations);

  // If median time is positive assign to estimated waiting time then update the department in the database
  if (medianTime > 0) {
      estWaitingTime = medianTime;

      await callModel(
        client.models.Department.update({
            id: departmentName,
            estimatedWaitingTime: Math.round(estWaitingTime),
        }),
        "recalculateDepartmentQueue: Department.update failed"
      );
  }

  return estWaitingTime;
}

/**
 * Updates position and estimated wait time bounds for all waiting tickets.
 * Tickets are assigned positions 0, 1, 2, ... based on their order in the array.
 * Wait time lower bound = estWaitingTime * position, upper bound = lower + 20.
 *
 * @param waitingTickets - Waiting tickets sorted by current position ascending
 * @param estWaitingTime - The estimated time in minutes to serve one person
 */
async function updateTickets(waitingTickets: Schema["Ticket"]["type"][], estWaitingTime:number)
{
  for (let i = 0; i < waitingTickets.length; i++) {

      const ticket = waitingTickets[i];

      const position = i; 

      const { lower, upper } = getEstimatedWaitTimeBounds(position, estWaitingTime);

      await callModel(
        client.models.Ticket.update({
            id: ticket.id,
            position,
            estimatedWaitTimeLower: lower,
            estimatedWaitTimeUpper: upper,
        }),
        `recalculateDepartmentQueue: Ticket.update failed for ticket ${ticket.id}`
      );
  }
}

/**
 * Recalculates queue positions and estimated wait times for all waiting tickets
 * in a department for today.
 *
 * Sorts waiting tickets by their current position, then reassigns positions
 * (0, 1, 2, ...) to close any gaps left by completed tickets. Estimated wait
 * times are calculated using the median time from the last 5 completed
 * tickets. If fewer than 5 completed tickets exist today, falls back to the
 * department's stored estimatedWaitingTime or hardcoded defaults.
 *
 * @param departmentName - The ID of the department whose queue should be recalculated
 * @throws Error if no tickets exist for today or the department cannot be found
 * @returns true when all ticket updates have been successfully written to DynamoDB
 */
export async function recalculateDepartmentQueue(departmentName:string) {
  
    let tickets = await getTodayTickets(departmentName);

    // Sort based on position in the queue 
    tickets.sort((a, b) => a.position - b.position)
    
    // Waiting tickets
    const waitingTickets = tickets.filter(
      t => t.status === "WAITING"
    );

    // Completed tickets
    const completedTickets = tickets
      .filter(t => t.status === "COMPLETED" && t.completedAt)
      .sort((a,b) =>
        new Date(b.completedAt!).getTime() -
        new Date(a.completedAt!).getTime()
      )
      .slice(0,5);
    
    // Get department
    const department = await callModel(
      client.models.Department.get({ id: departmentName }),
      "recalculateDepartmentQueue: Department.get failed"
    );

    if (!department) {
      throw new Error(`Department ${departmentName} not found`);
    }

    let estWaitingTime = 0;
    if (completedTickets.length >= 5) {
        estWaitingTime = await calculateEstTimeWithMedian(completedTickets, departmentName);
    } 
    else {
        estWaitingTime =
          department.estimatedWaitingTime ?? getDefaultEstimatedWaitingTime(department.name);
    }
    
    await updateTickets(waitingTickets, estWaitingTime);

    return true;
}
