import type { PostConfirmationTriggerHandler } from "aws-lambda";
import {
    CognitoIdentityProviderClient,
    AdminAddUserToGroupCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../data/resource";

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION,
});

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

    // const cognitoUserId = event.request.userAttributes.sub;
    // const email = event.request.userAttributes.email;
    // const givenName = event.request.userAttributes.given_name; 
    // const familyName = event.request.userAttributes.family_name; 

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

    // Create a corresponding User record in DynamoDB
    // try {
    //     const client = generateClient<Schema>({
    //         authMode: "identityPool",
    //     });

    //     const result = await client.models.User.create({
    //         cognitoUserId: cognitoUserId,
    //         email: email,
    //         firstName: givenName,
    //         lastName: familyName,
    //     });

    //     console.log(`Successfully created User record for ${email} with ID ${result.data?.id}`);
    // }
    // catch (error) {
    //     console.error("Failed to create User record:", error);
    // }

    // Return the event object as required by Cognito triggers
    return event;
};


