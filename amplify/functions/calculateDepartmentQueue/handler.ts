import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";
import type { DynamoDBStreamHandler } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";

/**
 * Lambda function to calculate and update the queue for a department.
 *
 * This function recalculates the estimated waiting times for all
 * waiting tickets in a department for today. It uses the median service
 * time from the last 5 completed tickets (if available) to update
 * the department's estimated waiting time and each ticket's position
 * and estimated wait time bounds.
 *
 * @param event.arguments.departmentId - The ID of the department whose queue should be recalculated
 * @returns true if the calculation and updates were successful
 *   - departmentId is missing
 *   - no tickets exist at all
 *   - no tickets exist for today
 *   - no tickets exist for today in the specified department
 *   - the department with the given departmentId cannot be found

 */

const client = await getAmplifyClient();

function median(values: number[]) {
  if (values.length === 0) return 0;

  values.sort((a, b) => a - b);

  const mid = Math.ceil(values.length / 2);

  return values[mid];
}

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

// Get today's tickets for the department
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

// Calculate median if enough completed tickets exist
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

// Update all waiting tickets
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

async function recalculateDepartmentQueue(departmentId:string) {
  
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

export const handler: DynamoDBStreamHandler = async (event) => {
  // We may receive a batch of updates, but we only need to recalculate once per department
  // Use a Set to track which departments need recalculation
  const departmentIds = new Set<string>();

  for (const record of event.Records) {
    if (record.eventName !== "MODIFY") {
      continue;
    }
    if (!record.dynamodb?.NewImage || !record.dynamodb?.OldImage) {
      continue;
    }

    const newImage = unmarshall(record.dynamodb.NewImage as any);
    const oldImage = unmarshall(record.dynamodb.OldImage as any);

    // Only trigger if the status has changed, as this is what affects the queue
    if (newImage.status === oldImage.status) {
      continue;
    }

    const departmentId = newImage.departmentId;
    if (!departmentId) {
      console.error("calculateDepartmentQueue: departmentId is missing in record", record);
      continue;
    }

    departmentIds.add(departmentId);
  }

  for (const departmentId of departmentIds) {
    try {
      await recalculateDepartmentQueue(departmentId);
    } 
    catch (error) {
      console.error(`recalculateDepartmentQueue: failed for department ${departmentId}`, error);
    }
  }
};