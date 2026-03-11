import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './functions/postConfirmation/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Aws } from 'aws-cdk-lib';
import { submitEnquiry } from "./functions/submitEnquiry/resource";
import { getAvailableAppointmentTimes } from "./functions/getAvailableAppointmentTimes/resource";
import { Table, AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
	auth,
	data,
	postConfirmation,
  submitEnquiry,
  getAvailableAppointmentTimes,
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
// Create a DynamoDB table to keep track of daily ticket numbers, claimed ticket numbers,
// and claimed case reference numbers for the submitEnquiry function
const enquiriesStateTable = new Table(backend.stack, "EnquiriesStateTable", {
  partitionKey: { name: "pk", type: AttributeType.STRING },
  sortKey: { name: "sk", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: "expiresAt",
});

enquiriesStateTable.grantReadWriteData(backend.submitEnquiry.resources.lambda);
enquiriesStateTable.grantReadData(backend.getAvailableAppointmentTimes.resources.lambda);

backend.submitEnquiry.addEnvironment(
  "ENQUIRIES_STATE_TABLE",
  enquiriesStateTable.tableName,
);

backend.getAvailableAppointmentTimes.addEnvironment(
  "ENQUIRIES_STATE_TABLE",
  enquiriesStateTable.tableName,
);
