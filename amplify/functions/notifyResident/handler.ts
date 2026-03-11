import type { DynamoDBStreamHandler } from "aws-lambda";
import { getAmplifyClient, type AmplifyClient } from "../utils/amplifyClient";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { endUserMessagingClient } from "../utils/endUserMessagingClient";
import { SendTextMessageCommand } from "@aws-sdk/client-pinpoint-sms-voice-v2";
import { sesClient } from "../utils/sesClient";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";

async function getCase(client: AmplifyClient, caseId: string) {
    const { data: caseData } = await client.models.Case.get({ id: caseId });
    return caseData ?? null;
}

async function getUser(client: AmplifyClient, userId: string) {
    const { data: user } = await client.models.User.get({ id: userId });
    return user ?? null;
}

async function sendSms(phoneNumber: string, ticketNumber: string, message: string): Promise<void> {
    const SMS_ORIGINATION_IDENTITY = process.env.SMS_ORIGINATION_IDENTITY;
    if (!SMS_ORIGINATION_IDENTITY) {
        console.error("notifyResident: SMS_ORIGINATION_IDENTITY environment variable is not set.");
        return;
    }

    try {
        await endUserMessagingClient.send(new SendTextMessageCommand({
            DestinationPhoneNumber: phoneNumber,
            MessageBody: message,
            OriginationIdentity: SMS_ORIGINATION_IDENTITY,
            MessageType: "TRANSACTIONAL",
        }));
        console.log(`notifyResident: SMS sent for ticket ${ticketNumber} to phone number ${phoneNumber}`);
    } 
    catch (error) {
        console.error("notifyResident: Error sending SMS:", error);
    }
}

async function sendEmail(email: string, ticketNumber: string, message: string): Promise<void> {
    const senderEmail = process.env.SENDER_EMAIL;
    if (!senderEmail) {
        console.error("notifyResident: SENDER_EMAIL environment variable is not set.");
        return;
    }

    try {
        await sesClient.send(new SendEmailCommand({
            FromEmailAddress: senderEmail,
            Destination: {
                ToAddresses: [email],
            },
            Content: {
                Simple: {
                    Subject: {
                        Data: "Your ticket is now being served",
                    },
                    Body: {
                        Text: {
                            Data: message,
                        },
                    },
                },
            },
        }));
        console.log(`notifyResident: Email sent for ticket ${ticketNumber} to email ${email}`);
    } 
    catch (error) {
        console.error("notifyResident: Error sending email:", error);
    }
}

/**
 * Lambda function to send notifications to residents based on changes to their ticket in the queue.
 * 
 * Triggered by DynamoDB stream events on the Ticket table
 * Listens for updates to the Ticket records and sends an SMS or email notification to the resident
 * 
 * @param event - DynamoDB stream event containing the old and new images of the Ticket record data
 * 
 */
export const handler: DynamoDBStreamHandler = async (event) => {
    const client = await getAmplifyClient();

    for (const record of event.Records) {
        // Only care about updates, not inserts or deletes
        if (record.eventName !== "MODIFY") {
            continue;
        }
        // Ensure we have both the old and new images to compare
        if (!record.dynamodb?.NewImage || !record.dynamodb?.OldImage) {
            continue;
        }

        // Unmarshall the DynamoDB images to get the actual data objects
        // Casted to any because the types are mismatched between @aws-lambda and @aws-sdk/util-dynamodb, but we know the structure is correct
        const newImage = unmarshall(record.dynamodb.NewImage as any);
        const oldImage = unmarshall(record.dynamodb.OldImage as any);

        // Only fire on the transition TO position 0
        if (newImage.position !== 0 || oldImage.position === 0) {
            continue;
        }

        const caseId = newImage.caseId;
        const ticketNumber = newImage.ticketNumber;

        if (!caseId || !ticketNumber) {
            console.error("notifyResident: Missing caseId or ticketNumber in DynamoDB record:", { newImage, oldImage });
            continue;
        }

        const caseData = await getCase(client, caseId);
        if (!caseData) {
            console.error(`notifyResident: Case with ID ${caseId} not found.`);
            continue;
        }

        const user = await getUser(client, caseData.userId);
        if (!user) {
            console.error(`notifyResident: User with ID ${caseData.userId} not found.`);
            continue;
        }

        // Retrieve contact details from user record
        const phoneNumber = user.phoneNumber ?? null;
        const email = user.email ?? null;

        // They have no form of contact, skip
        if (!phoneNumber && !email) {
            console.log(`notifyResident: User with ID ${user.id} has no contact information, skipping notification for ticket ${ticketNumber}.`);
            continue;
        }

        const message = `Your ticket number ${ticketNumber} is now being served. Please proceed to the counter.`;

        // If they have a phone number, we contact them via SMS using End User Messaging
        if (phoneNumber) {
            await sendSms(phoneNumber, ticketNumber, message);
        }
        // If they don't have a phone number but have an email, we contact them via email using SES
        else if (email) {
            await sendEmail(email, ticketNumber, message);
        }
    }
};