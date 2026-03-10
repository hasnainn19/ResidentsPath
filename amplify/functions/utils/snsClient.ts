import { SNSClient } from "@aws-sdk/client-sns";

/**
 * Shared SNS client for use across backend Lambda functions.
 *
 * Initialised at module level so that the same client instance is reused across
 * warm Lambda invocations (Node.js module caching). AWS_REGION is automatically
 * injected into every Lambda by the AWS runtime.
 */
export const snsClient = new SNSClient({
    region: process.env.AWS_REGION,
});