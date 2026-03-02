import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { submitEnquiry } from "./functions/submitEnquiry/resource";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  submitEnquiry,
});

// Create a DynamoDB table to keep track of daily ticket numbers for the submitEnquiry function
// to ensure unique ticket numbers without race conditions
const ticketCounterTable = new Table(backend.stack, "TicketCounterTable", {
  partitionKey: { name: "counterId", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: "expiresAt",
});

// Table to track claimed ticket numbers for each service day
// This allows ticket numbers to be reused if the main counter reaches 1000
// A function to release claimed tickets on completion will need to be implemented elsewhere
// (This needs to be linked to ticket completion and deletion so ticket numbers are acually released)
const ticketNumberClaimsTable = new Table(backend.stack, "TicketNumberClaimsTable", {
  partitionKey: { name: "queueId", type: AttributeType.STRING },
  sortKey: { name: "ticketNumber", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: "expiresAt",
});

ticketCounterTable.grantReadWriteData(backend.submitEnquiry.resources.lambda);
ticketNumberClaimsTable.grantReadWriteData(backend.submitEnquiry.resources.lambda);

backend.submitEnquiry.addEnvironment("TICKET_COUNTER_TABLE", ticketCounterTable.tableName);
backend.submitEnquiry.addEnvironment(
  "TICKET_NUMBER_CLAIMS_TABLE",
  ticketNumberClaimsTable.tableName,
);