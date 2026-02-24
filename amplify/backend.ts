import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './functions/postConfirmation/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
	auth,
	data,
	postConfirmation,
});

/**
 * Grant necessary permissions to the postConfirmation Lambda to manage Cognito groups and write to DynamoDB.
 * 
 * Due to circular dependency issues, we cannot reference the actual ARNs of the Cognito User Pool and DynamoDB table here.
 * Instead, we hardcode the ARN patterns for these resources, which will allow the
 * Lambda to have the necessary permissions without causing deployment issues.
 * 
 * Actual ARNs will look like:
 * arn:aws:cognito-idp:{region}:{accountId}:userpool/{userPoolId}
 * arn:aws:dynamodb:{region}:{accountId}:table/User-{env}
 * 
 * This approach is a workaround for the limitations of the Amplify CLI and CDK when it comes to cross-referencing resources in different stacks.
 * It allows us to ensure the postConfirmation Lambda has the necessary permissions to function correctly without causing deployment issues.
 */
backend.postConfirmation.resources.lambda.addToRolePolicy(
	new PolicyStatement({
		actions: [
			"cognito-idp:AdminAddUserToGroup", // Add users to Cognito groups
			"dynamodb:PutItem",                // Write User records directly to DynamoDB
		],
		resources: [
			`arn:aws:cognito-idp:eu-west-2:*:userpool/*`, // backend.auth.resources.userPool.userPoolArn
			`arn:aws:dynamodb:eu-west-2:*:table/User-*`,  // backend.data.resources.tables["User"].tableArn
		],
	})
);