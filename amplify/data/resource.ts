import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { getTicketStatus } from '../functions/getTicketStatus/resource';

/**
 * id, createdAt, and updatedAt fields are automatically added to all models
 */
const schema = a.schema({
	// User (Resident) - supports both registered users and walk-ins
	User: a
		.model({
			// User type
			isRegistered: a.boolean().default(false), // true = has account, false = walk-in

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
		})
		.authorization((allow) => [
			allow.owner(), // Registered users can access their own data
			allow.groups(["Staff"]), // Staff can access all user data
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
		})
		.authorization((allow) => [
			allow.owner(), // Registered users can see their own cases
			allow.groups(["Staff"]), // Staff can see all cases
		]),

	// Department - service departments (Housing, Council Tax, etc)
	Department: a
		.model({
			// Department information
			name: a.string().required(),
			isActive: a.boolean().default(false), // Is this department currently operating?

			// Relationships
			cases: a.hasMany("Case", "departmentId"),
			tickets: a.hasMany("Ticket", "departmentId"),
			staff: a.hasMany("Staff", "departmentId"),
		})
		.authorization((allow) => [
			allow.groups(["Staff"]), // Staff can see all departments
			allow.guest().to(["read"]) // Department data is publically readable
		]),

	// Ticket - represents a queue entry for a resident's visit
	Ticket: a
		.model({
			// Foreign keys
			caseId: a.id().required(),
			departmentId: a.id().required(),

			// Display information
			ticketNumber: a.string().required(),
			// displayName: a.string().required(),

			// Queue information
			urgency: a.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
			status: a.enum(["WAITING", "CALLED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "LEFT"]),
			placement: a.integer(),
			estimatedWaitTime: a.string(), // e.g "15-20 minutes, 1-2 hours"

			// Timestamps for queue tracking
			calledAt: a.datetime(),
			completedAt: a.datetime(),

			// Visit notes
			notes: a.string(),

			// Relationships
			case: a.belongsTo("Case", "caseId"),
			department: a.belongsTo("Department", "departmentId"),
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
	
	// Custom queries and mutations (lambdas defined in amplify/functions)
	getTicketStatus: a
		.query()
		.arguments({
			ticketNumber: a.string().required()
		})
		.returns(a.customType({
			ticketNumber: a.string(),
			status: a.string(),
			placement: a.integer(),
			estimatedWaitTime: a.string(),
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

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
