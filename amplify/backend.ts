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
			`arn:aws:cognito-idp:eu-west-2:*:userpool/*`, // backend.auth.resources.userPool.userPoolArn
		],
	})
);