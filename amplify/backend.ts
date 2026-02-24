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

// Provide environment variables
// backend.postConfirmation.addEnvironment("USER_POOL_ID", backend.auth.resources.userPool.userPoolId);
// backend.postConfirmation.addEnvironment("USER_TABLE_NAME", backend.data.resources.tables["User"].tableName);

// Grant IAM permissions
backend.postConfirmation.resources.lambda.addToRolePolicy(
	new PolicyStatement({
		actions: [
			"cognito-idp:AdminAddUserToGroup", // Add users to Cognito groups
			"dynamodb:PutItem",                // Write User records directly to DynamoDB
		],
		// Grant permissions to both the Cognito User Pool and the DynamoDB User table
		resources: [
			`arn:aws:cognito-idp:eu-west-2:*:userpool/*`, 
			// backend.auth.resources.userPool.userPoolArn,
			// backend.data.resources.tables["User"].tableArn,
		],
	})
);