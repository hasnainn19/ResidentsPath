import type { DynamoDBStreamHandler, DynamoDBRecord } from "aws-lambda";
import { getAmplifyClient, type AmplifyClient } from "../utils/amplifyClient";
import { callModel } from "../utils/runCleanup";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { endUserMessagingClient } from "../utils/endUserMessagingClient";
import { SendTextMessageCommand } from "@aws-sdk/client-pinpoint-sms-voice-v2";
import { sesClient } from "../utils/sesClient";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";

/**
 * Validates a raw DynamoDB stream record and extracts the unmarshalled images.
 * Checks that the event is a MODIFY, that both images are present, and that the
 * ticket record contains the required fields.
 *
 * @returns An object containing the unmarshalled images, caseId, and ticketNumber, or null if invalid
 */
function validateTicketRecord(record: DynamoDBRecord) {
    if (record.eventName !== "MODIFY") {
        return null;
    }
    if (!record.dynamodb?.NewImage || !record.dynamodb?.OldImage) {
        return null;
    }

    // Casted to any because the types are mismatched between @aws-lambda and @aws-sdk/util-dynamodb, but we know the structure is correct
    const newImage = unmarshall(record.dynamodb.NewImage as any);
    const oldImage = unmarshall(record.dynamodb.OldImage as any);

    const caseId = newImage.caseId;
    const ticketNumber = newImage.ticketNumber;
    if (!caseId || !ticketNumber) {
        console.error("notifyResident: Missing caseId or ticketNumber in ticket record,", JSON.stringify(record));
        return null;
    }

    return { newImage, oldImage, caseId, ticketNumber };
}

/**
 * Determines whether a resident should be notified based on the changes between
 * the old and new images of a Ticket record.
 *
 * @returns the message to be sent to the resident if they should be notified or null otherwise
 */
function shouldNotifyResident(newImage: Record<string, any>, oldImage: Record<string, any>, ticketNumber: string): string | null {
    // Being served
    if (newImage.position === 0 && oldImage.position !== 0) {
        return `Your ticket number ${ticketNumber} is now being served. Please proceed to the counter.`;
    }

    // Under 10 minutes
    if (
        newImage.estimatedWaitTimeLower <= 10 &&
        oldImage.estimatedWaitTimeLower > 10 &&
        newImage.position !== 0
    ) {
        return `Your ticket number ${ticketNumber} will be served in approximately 10 minutes or less.`;
    }

    // Under 20 minutes
    if (
        newImage.estimatedWaitTimeLower <= 20 &&
        oldImage.estimatedWaitTimeLower > 20 &&
        newImage.position !== 0
    ) {
        return `Your ticket number ${ticketNumber} will be served in approximately 20 minutes or less.`;
    }

    // Under 30 minutes
    if (
        newImage.estimatedWaitTimeLower <= 30 &&
        oldImage.estimatedWaitTimeLower > 30 &&
        newImage.position !== 0
    ) {
        return `Your ticket number ${ticketNumber} will be served in approximately 30 minutes or less.`;
    }

    // Under 60 minutes
    if (
        newImage.estimatedWaitTimeLower <= 60 &&
        oldImage.estimatedWaitTimeLower > 60 &&
        newImage.position !== 0
    ) {
        return `Your ticket number ${ticketNumber} will be served in approximately 60 minutes or less.`;
    }

    return null;
}

async function getCase(client: AmplifyClient, caseId: string) {
    return callModel(client.models.Case.get({ id: caseId }));
}

async function getUser(client: AmplifyClient, userId: string) {
    return callModel(client.models.User.get({ id: userId }));
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
                        Data: "An update about your ticket",
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
        const validated = validateTicketRecord(record);
        if (!validated) {
            continue;
        }

        const { newImage, oldImage, caseId, ticketNumber } = validated;

        // Check if they have opted-in for notifications on this ticket
        if (!newImage.notificationsEnabled) {
            continue;
        }

        const message = shouldNotifyResident(newImage, oldImage, ticketNumber);
        if (!message) {
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
        const preferredContactMethod = newImage.notificationPreferredContactMethod;

        // They have no form of contact, skip (although if they have enabled notis then they should have at least one)
        if (!phoneNumber && !email) {
            console.log(`notifyResident: User with ID ${user.id} has no contact information, skipping notification for ticket ${ticketNumber}.`);
            continue;
        }

        if (preferredContactMethod === 'SMS' && phoneNumber) {
            await sendSms(phoneNumber, ticketNumber, message);
        }
        else if (preferredContactMethod === 'EMAIL' && email) {
            await sendEmail(email, ticketNumber, message);
        }
        else {
            console.error(`notifyResident: No contact info for preferred method ${preferredContactMethod} on ticket ${ticketNumber}, skipping.`);
        }
    }
};