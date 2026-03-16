import type { Schema } from "../../data/resource";
import { getAmplifyClient } from "../utils/amplifyClient";

/**
 * Enables or disables queue notifications for a resident's ticket.
 * When enabling, also updates the resident's contact information if not already set.
 *
 * @param event.arguments.ticketId - The ticket to update
 * @param event.arguments.caseId - Used to verify the ticket belongs to this case
 * @param event.arguments.enabled - True to enable notifications, false to disable
 * @param event.arguments.contactMethod - SMS or EMAIL (required when enabled is true)
 * @param event.arguments.contactValue - E.164 phone number or email address (required when enabled is true)
 */
export const handler: Schema["toggleNotifications"]["functionHandler"] = async (event) => {
    const { ticketId, caseId, enabled, contactMethod, contactValue } = event.arguments;

    if (enabled && (!contactMethod || !contactValue)) {
        throw new Error("toggleNotifications: contactMethod and contactValue are required when enabling notifications");
    }

    const client = await getAmplifyClient();

    const { data: ticket } = await client.models.Ticket.get({ id: ticketId });
    if (!ticket) {
        throw new Error("toggleNotifications: Ticket not found");
    }
    if (ticket.caseId !== caseId) {
        throw new Error("toggleNotifications: Not authorized");
    }

    if (enabled) {
        const { data: caseData } = await client.models.Case.get({ id: caseId });
        if (!caseData) {
            throw new Error("toggleNotifications: Case not found");
        }

        const { data: user } = await client.models.User.get({ id: caseData.userId });
        if (!user) {
            throw new Error("toggleNotifications: User not found");
        }

        // Write contact value to User record only if not already set
        if (contactMethod === 'SMS' && !user.phoneNumber) {
            await client.models.User.update({ id: user.id, phoneNumber: contactValue });
        } 
        else if (contactMethod === 'EMAIL' && !user.email) {
            await client.models.User.update({ id: user.id, email: contactValue });
        }

        await client.models.Ticket.update({
            id: ticketId,
            notificationsEnabled: true,
            notificationPreferredContactMethod: contactMethod,
        });
    } 
    else {
        await client.models.Ticket.update({
            id: ticketId,
            notificationsEnabled: false,
            notificationPreferredContactMethod: null,
        });
    }

    return { success: true };
};
