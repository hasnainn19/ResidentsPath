import { PinpointSMSVoiceV2Client } from "@aws-sdk/client-pinpoint-sms-voice-v2";

/**
 * Shared End User Messaging client for use across backend Lambda functions.
 *
 * Initialised at module level so that the same client instance is reused across
 * warm Lambda invocations (Node.js module caching). AWS_REGION is automatically
 * injected into every Lambda by the AWS runtime.
 */
export const endUserMessagingClient = new PinpointSMSVoiceV2Client({
    region: process.env.AWS_REGION,
});