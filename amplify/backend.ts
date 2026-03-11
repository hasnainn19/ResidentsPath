import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './functions/postConfirmation/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Aws } from 'aws-cdk-lib';
import { submitEnquiry } from "./functions/submitEnquiry/resource";
import { Table, AttributeType, BillingMode, CfnTable, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
import { getTicketInfo } from "./functions/getTicketInfo/resource";
import { calculateDepartmentQueue } from "./functions/calculateDepartmentQueue/resource";
import { notifyResident } from "./functions/notifyResident/resource";
import { FilterCriteria, FilterRule, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';


/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
	auth,
	data,
	postConfirmation,
    submitEnquiry,
    getTicketInfo,
    calculateDepartmentQueue,
    notifyResident,
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


/**
 * Access the Ticket table and enable DynamoDB streams 
 * Amplify doesn't expose stream config directly so we go through the underlying CloudFormation resource to set it up
 */
const ticketTable = backend.data.resources.tables["Ticket"];
const cfnTicketTable = ticketTable.node.defaultChild as CfnTable;
cfnTicketTable.streamSpecification = {
  streamViewType: StreamViewType.NEW_AND_OLD_IMAGES,
}

/**
 * Attach the Ticket stream to the Lambda.
 * The filter tells AWS to only invoke the Lambda for MODIFY events
 * 
 * Further filters can be added that target the dynamoDB record's new and old images
 */
backend.notifyResident.resources.lambda.addEventSource(
  new DynamoEventSource(ticketTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    bisectBatchOnError: true,
    filters: [
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("MODIFY"),
        dynamodb: {
          // Filter for when the record's data changes to something specific
          NewImage: {
            position: { N: FilterRule.isEqual("0") }, // Trigger when position changes to 0
          },
          OldImage: {
            // Would also want to filter where position was already 0, but FilterRule doesn't have a notEqual operator
            // position: { N: FilterRule.isNotEqual("0") },
          },
        },
      }),
    ]
  })
);

// Grant the Lambda permission to send SMS via End User Messaging
backend.notifyResident.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["sms-voice:SendTextMessage"],
    resources: ["arn:aws:sms-voice:eu-west-2:812914649610:sender-id/HOUNSLOW/GB"],
  })
);

// Grant the Lambda permission to send emails via SES
backend.notifyResident.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ses:SendEmail"],
    resources: ["*"],
  })
);

// SMS origination identity is the ARN of the sender ID that is registered in AWS End User Messaging for sending SMS messages.
// The Lambda specifies it when sending SMS, ensuring that messages are sent from the registered sender ID.
backend.notifyResident.addEnvironment("SMS_ORIGINATION_IDENTITY", "arn:aws:sms-voice:eu-west-2:812914649610:sender-id/HOUNSLOW/GB");

backend.notifyResident.addEnvironment("SENDER_EMAIL", "noreply@domain.com");