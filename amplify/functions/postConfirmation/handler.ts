import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";
import { getAmplifyClient } from "../utils/amplifyClient";
import { cognitoClient } from "../utils/cognitoClient";
import { logModelErrors } from "../utils/runCleanup";

/**
 * Lambda function to handle Cognito post-confirmation trigger.
 *
 * Triggered automatically after a user confirms their account in Cognito.
 *
 * Tasks:
 * 1. Adds newly confirmed users to the "Residents" Cognito group
 * 2. Creates a corresponding User record in DynamoDB with the user's email and name attributes
 *
 * @param event - Cognito post-confirmation trigger event containing new user account data
 * @returns The same event object (required by Cognito)
 */
export const handler: PostConfirmationTriggerHandler = async (event) => {

    const cognitoUserId = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email;
    const givenName = event.request.userAttributes.given_name; 
    const familyName = event.request.userAttributes.family_name; 

    // Add the new user to the "Residents" group in Cognito
    try {
        const addToGroupCommand = new AdminAddUserToGroupCommand({
            UserPoolId: event.userPoolId,
            Username: event.userName,   // Cognito username, same as email by default
            GroupName: "Residents",     // Default group for all new users
        });

        await cognitoClient.send(addToGroupCommand);
        console.log(`Successfully added user ${event.userName} to Residents group.`);
    }
    catch (error) {
        // Log the error but do not fail the function, as we don't want to block user sign-up
        console.error(`Failed to add user ${event.userName} to Residents group:`, error);
    }

    // Create a corresponding User record in DynamoDB via AppSync
    try {
        const client = await getAmplifyClient();

        const result = await client.models.User.create({
            id: cognitoUserId, // Use Cognito sub as the User ID for registered users
            isRegistered: true,
            email: email,
            firstName: givenName,
            lastName: familyName,
        });

        if (result.errors?.length) {
            logModelErrors("postConfirmation: User.create failed", result.errors);
        } 
        else {
            console.log(`Successfully created User record for ${email} with ID ${result.data?.id}`);
        }
    }
    catch (error) {
        console.error("Failed to create User record:", error);
    }

    // Return the event object as required by Cognito triggers
    return event;
};


