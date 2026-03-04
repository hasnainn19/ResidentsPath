import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './functions/postConfirmation/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Aws } from 'aws-cdk-lib';
import { submitEnquiry } from "./functions/submitEnquiry/resource";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
	auth,
	data,
	postConfirmation,
  submitEnquiry,
});

/**
 * Grant permissions to the postConfirmation Lambda to add users to Cognito groups
 * 
 * Due to circular dependency issues, we cannot reference the actual ARNs of the Cognito User Pool here.
 * Instead, we hardcode the ARN patterns for these resources, which will allow the
 * Lambda to have the necessary permissions without causing deployment issues.
 * 
 * Actual ARNs will look like:
 * arn:aws:cognito-idp:{region}:{accountId}:userpool/{userPoolId}
 * 
 * This approach is a workaround for the limitations of the Amplify CDK when it comes to cross-referencing resources in different stacks.
 */
backend.postConfirmation.resources.lambda.addToRolePolicy(
	new PolicyStatement({
		actions: [
			"cognito-idp:AdminAddUserToGroup", // Add users to Cognito groups
		],
		resources: [
			// backend.auth.resources.userPool.userPoolArn causes circular dependency 
			`arn:aws:cognito-idp:${Aws.REGION}:${Aws.ACCOUNT_ID}:userpool/*`, 
		],
	})
);
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
// (This needs to be linked to ticket completion and deletion so ticket numbers are actually released)
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