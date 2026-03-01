import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig, type DataClientEnv } from "@aws-amplify/backend-function/runtime";
import type { Schema } from "../../data/resource";

/**
 * Singleton flag to track whether Amplify has been configured in this Lambda container.
 *
 * Lambda containers are reused across invocations — once a container is warm, subsequent
 * invocations of the same Lambda reuse the same process. Module-level variables persist
 * between those reuses, so we only need to call Amplify.configure() once per container
 * lifetime rather than on every invocation.
 */
let configured = false;

/**
 * Configures the Amplify library using environment variables injected by Amplify Gen 2
 * at deploy time. This is the backend equivalent of calling Amplify.configure(outputs)
 * in the frontend, where outputs comes from amplify_outputs.json.
 *
 * When Amplify Gen 2 deploys a Lambda that is registered in the backend, it automatically
 * injects the AppSync endpoint, region, and other configuration as environment variables
 * into the Lambda runtime. getAmplifyDataClientConfig reads those env vars and produces
 * the same config object that amplify_outputs.json would provide on the frontend.
 *
 * Skips configuration if already done (singleton per Lambda container).
 */
async function ensureConfigured(): Promise<void> {
    if (configured) return;

    const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
        process.env as unknown as DataClientEnv
    );

    Amplify.configure(resourceConfig, libraryOptions);
    configured = true;
}

/**
 * Returns a configured Amplify data client for use inside backend Lambda functions.
 *
 * Uses authMode "iam" so that the client authenticates to AppSync using the Lambda
 * execution role's IAM credentials. These are the AWS credentials automatically
 * injected by AWS into every Lambda (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 * AWS_SESSION_TOKEN). This is the correct auth mode for backend Lambdas - the Lambda
 * already has IAM credentials, so there is no need to exchange them via Cognito
 * Identity Pool (which is designed for end-users in browsers, not for Lambdas).
 *
 * For this client to have access to specific data models, the Lambda's resource must be
 * granted permission on those models using allow.resource(Lambda) in the schema
 * authorization rules (amplify/data/resource.ts). Without that, AppSync will deny
 * the request even if IAM credentials are valid.
 *
 * @returns A typed Amplify data client authenticated via IAM
 * 
 */
export async function getAmplifyClient() {
    await ensureConfigured();
    return generateClient<Schema>({ authMode: "iam" });
}
