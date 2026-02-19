import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { getTicketStatus } from '../functions/getTicketStatus/resource';

/**
 * id, createdAt, and updatedAt fields are automatically added to all models
 */
const schema = a.schema({
	// User (Resident) - supports both registered users and walk-ins
	User: a
		.model({
			cognitoUserId: a.string(), // Authentication link (null for walk-ins)

			// Name fields (required for all users)
			title: a.enum(["MR", "MRS", "MS", "MISS", "DR", "MX"]),
			firstName: a.string().required(),
			lastName: a.string().required(),
			middleNames: a.string(),
			preferredName: a.string(),

			// Contact info (optional - walk-ins may not provide)
			email: a.string(),
			phoneNumber: a.string(),

			// Address fields (optional - may not have for walk-ins or homeless)
			addressLine1: a.string(),
			addressLine2: a.string(),
			city: a.string(),
			postcode: a.string(),

			// Relationships
			cases: a.hasMany("Case", "userId"),
			appointments: a.hasMany("Appointment", "userId"),
		})
		.authorization((allow) => [
			allow.groups(["Staff"]), // Only staff can access user data directly
		]),
	
	// Case - represents an issue or matter that a resident needs help with
	Case: a
		.model({
			// Foreign keys
			userId: a.id().required(),
			departmentId: a.id().required(),

			// Case information
			referenceNumber: a.string().required(), 
			description: a.string(),
			status: a.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
			priority: a.boolean().default(false),
			flag: a.string(), // "SAFEGUARDING, VULNERABLE, URGENT"
			notes: a.string(),

			// Relationships
			user: a.belongsTo("User", "userId"),
			department: a.belongsTo("Department", "departmentId"),
			tickets: a.hasMany("Ticket", "caseId"),
			appointments: a.hasMany("Appointment", "caseId"),
		})
		.authorization((allow) => [
			allow.groups(["Staff"]), // Only staff can access cases directly
		]),

	// Department - service departments (Housing, Council Tax, etc)
	Department: a
		.model({
			// Department information
			name: a.string().required(),
			isActive: a.boolean().default(false), // Is this department currently operating?

			// Relationships
			cases: a.hasMany("Case", "departmentId"),
			staff: a.hasMany("Staff", "departmentId"),
		})
		.authorization((allow) => [
			allow.groups(["Staff"]), // Staff can see all departments
		]),

	// Ticket - represents a queue entry for a resident's visit
	Ticket: a
		.model({
			// Foreign keys
			caseId: a.id().required(),

			// Display information
			ticketNumber: a.string().required(),
			// displayName: a.string().required(),

			// Queue information
			urgency: a.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
			status: a.enum(["WAITING", "CALLED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "STEPPED_OUT"]),
			placement: a.integer().required(),
			estimatedWaitTimeLower: a.integer().required(), // Lower bound in minutes
			estimatedWaitTimeUpper: a.integer().required(), // Upper bound in minutes

			// Timestamps for queue tracking
			calledAt: a.datetime(),
			completedAt: a.datetime(),

			// Visit notes
			notes: a.string(),

			// Relationships
			case: a.belongsTo("Case", "caseId"),
		})
		.authorization((allow) => [
			allow.groups(["Staff"]), // Staff can see all tickets
		]),

	// Staff - represents a staff member at Hounslow
	Staff: a
		.model({
			// Foreign keys
			departmentId: a.id().required(),

			// Staff information
			cognitoUserId: a.string().required(), // Link to Cognito user for authentication
			name: a.string().required(),
			role: a.string().required(), // e.g "Receptionist"

			// Current status
			isAvailable: a.boolean().default(false),

			// Relationships
			department: a.belongsTo("Department", "departmentId"),

		})
		.authorization((allow) => [
			allow.groups(["Staff"]), // Only staff can see staff information
		]),

	// Appointment - represents a scheduled appointment for a registered resident
	Appointment: a
		.model({
			// Foreign keys
			userId: a.id().required(),
			caseId: a.id().required(),

			// Appointment scheduling
			date: a.date().required(),
			time: a.time().required(),

			// Appointment status
			status: a.enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]),

			// Additional information
			notes: a.string(),

			// Relationships
			user: a.belongsTo("User", "userId"),
			case: a.belongsTo("Case", "caseId"),
		})
		.authorization((allow) => [
			allow.groups(["Staff"]), // Only staff can access appointments directly
		]),
	
	// Custom queries and mutations (lambdas defined in amplify/functions)
	getTicketStatus: a
		.query()
		.arguments({
			ticketNumber: a.string().required()
		})
		.returns(a.customType({
			ticketNumber: a.string().required(),
			status: a.string().required(),
			placement: a.integer().required(),
			estimatedWaitTimeLower: a.integer().required(),
			estimatedWaitTimeUpper: a.integer().required(),
		}))
		.authorization((allow) => [allow.guest()]) // Anyone can check their ticket status with a ticket number
		.handler(a.handler.function(getTicketStatus)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
	schema,
	authorizationModes: {
		defaultAuthorizationMode: 'identityPool',
	},
});
