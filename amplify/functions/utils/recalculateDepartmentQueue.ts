import { getAmplifyClient } from "./amplifyClient";
import type { Schema } from "../../data/resource";

const client = await getAmplifyClient();

const DEFAULT_WAITING_TIMES: Record<string, number> = {
  "Council_Tax": 50,
  "Housing_Benefit": 50,
  "Homelessness": 100,
  "Adults_Duty": 30,
  "Childrens_Duty": 30,
  "Community_Hub_Advisor": 30,
  "General_Customer_Service": 10,
  "Other": 30,
};

/**
 * Returns the median value from a sorted array of numbers.
 * Used to calculate the median time from completed tickets.
 */
function median(values: number[]) {
  if (values.length === 0) return 0;

  values.sort((a, b) => a - b);

  const mid = Math.ceil(values.length / 2);

  return values[mid-1]; // return index 2 for length 5
}

/**
 * Fetches all tickets for a given department created today.
 *
 * @param departmentId - The ID of the department to fetch tickets for
 * @throws Error if no tickets are found for today
 * @returns An array of tickets for the specified department created today
 */
async function getTodayTickets(departmentId:string){
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const { data: tickets } = await client.models.Ticket.list({
      filter: {
          departmentId: { eq: departmentId },
          createdAt: {
              ge: startOfDay.toISOString(),
              le: endOfDay.toISOString()
          }
      }
  });

  if (!tickets || tickets.length === 0) {
    throw new Error(`No tickets found for department ${departmentId} for today`);
  }

  return tickets;
}

/**
 * Calculates the median time from the provided completed tickets and
 * updates the department's estimatedWaitingTime in DynamoDB with the result.
 *
 * @param completedTickets - The most recent completed tickets to calculate the median from
 * @param departmentId - The ID of the department to update
 * @returns The calculated median time in minutes, or 0 if it could not be determined
 */
async function calculateEstTimeWithMedian(completedTickets: Schema["Ticket"]["type"][], departmentId:string)
{
  let estWaitingTime=0;
  const durations: number[] = [];

  for (const ticket of completedTickets) {

      if (!ticket.createdAt || !ticket.completedAt) continue;

      const start = new Date(ticket.createdAt).getTime();
      const end = new Date(ticket.completedAt).getTime();

      const minutes = (end - start) / 60000;

      durations.push(minutes);
  }

  const medianTime = median(durations);

  // If median time is positive assign to estimated waiting time then update the department in the database
  if (medianTime > 0) {
      estWaitingTime = medianTime;

      await client.models.Department.update({
          id: departmentId,
          estimatedWaitingTime: Math.round(estWaitingTime),
      });
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

      const lower = Math.round(estWaitingTime * position);

      const upper = lower + 20;

      await client.models.Ticket.update({
          id: ticket.id,
          position,
          estimatedWaitTimeLower: lower,
          estimatedWaitTimeUpper: upper,
      });
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
 * @param departmentId - The ID of the department whose queue should be recalculated
 * @throws Error if no tickets exist for today or the department cannot be found
 * @returns true when all ticket updates have been successfully written to DynamoDB
 */
export async function recalculateDepartmentQueue(departmentId:string) {
  
    let tickets = await getTodayTickets(departmentId);

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
        new Date(b.completedAt ?? 0).getTime() -
        new Date(a.completedAt ?? 0).getTime()
      )
      .slice(0,5);
    
    // Get department 
    const { data: department } = await client.models.Department.get({ id: departmentId });

    if (!department) {
      throw new Error(`Department ${departmentId} not found`);
    }

    let estWaitingTime = 0;
    if (completedTickets.length >= 5) {
        estWaitingTime = await calculateEstTimeWithMedian(completedTickets, departmentId);
    } else {
        estWaitingTime = department?.estimatedWaitingTime ?? DEFAULT_WAITING_TIMES[department?.name ?? "Other"] ?? 30;
    }
    
    await updateTickets(waitingTickets, estWaitingTime);

    return true;
}