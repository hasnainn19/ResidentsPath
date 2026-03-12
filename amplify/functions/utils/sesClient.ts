import { SESv2Client } from "@aws-sdk/client-sesv2";

/**
 * Shared SES v2 client for use across backend Lambda functions.
 *
 * Initialised at module level so that the same client instance is reused across
 * warm Lambda invocations (Node.js module caching). AWS_REGION is automatically
 * injected into every Lambda by the AWS runtime.
 */
export const sesClient = new SESv2Client({
    region: process.env.AWS_REGION,
});