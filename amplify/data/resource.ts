import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { submitEnquiry } from "../functions/submitEnquiry/resource";
import { getSubmissionReceipt } from "../functions/getSubmissionReceipt/resource";
import { getAvailableAppointmentTimes } from "../functions/getAvailableAppointmentTimes/resource";
import { postConfirmation } from "../functions/postConfirmation/resource";
import { calculateDepartmentQueue } from "../functions/calculateDepartmentQueue/resource";
import { getTicketInfo } from "../functions/getTicketInfo/resource";
import { notifyResident } from "../functions/notifyResident/resource";
import { getServiceStats } from "../functions/getServiceStats/resource";
import { getDashboardStats } from "../functions/getDashboardStats/resource";
import { adjustQueuePosition } from "../functions/adjustQueuePosition/resource";
import { getQueueItems } from "../functions/getQueueItems/resource";
import { markTicketSeen } from "../functions/markTicketSeen/resource";
import { setCasePriority } from "../functions/setCasePriority/resource";
import { flagCaseSafeguarding } from "../functions/flagCaseSafeguarding/resource";

/**
 * id, createdAt, and updatedAt fields are automatically added to all models
 */
const schema = a
  .schema({
    // User (Resident) - supports both registered users and walk-ins
    User: a
      .model({
        // id is set to the Cognito sub for registered users, auto-UUID for walk-ins
        isRegistered: a.boolean().required(),

        // Name fields
        title: a.enum(["MR", "MRS", "MS", "MISS", "DR", "MX"]),
        firstName: a.string(),
        lastName: a.string(),
        middleNames: a.string(),
        preferredName: a.string(),
        pronouns: a.string(),
        pronounsOtherText: a.string(),

        // Contact info (optional - walk-ins may not provide)
        email: a.string(),
        additionalEmail: a.string(),
        phoneNumber: a.string(),

        // Address fields (optional - may not have for walk-ins or homeless)
        addressLine1: a.string(),
        addressLine2: a.string(),
        addressLine3: a.string(),
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
        flag: a.boolean().default(false),
        notes: a.string(),

        // What is being requested
        enquiry: a.string().required(),
        otherEnquiryText: a.string(),

        // Prioritisation criteria
        childrenCount: a.string(),
        householdSize: a.string(),
        ageRange: a.string(),
        hasDisabilityOrSensory: a.boolean(),
        disabilityType: a.string(),

        // Safeguarding / urgency
        domesticAbuse: a.boolean(),
        safeToContact: a.enum(["yes", "no", "PREFER_NOT_TO_SAY"]),
        safeContactNotes: a.string(),

        urgent: a.enum(["yes", "no", "unsure"]),
        urgentReason: a.string(),
        urgentReasonOtherText: a.string(),

        // Support needs
        supportNeedsJson: a.string(),
        supportNotes: a.string(),
        otherSupport: a.string(),

        additionalInfo: a.string(),

        // Relationships
        user: a.belongsTo("User", "userId"),
        department: a.belongsTo("Department", "departmentId"),
        tickets: a.hasMany("Ticket", "caseId"),
        appointments: a.hasMany("Appointment", "caseId"),
      })
      .secondaryIndexes((index) => [index("referenceNumber")])
      .authorization((allow) => [
        allow.groups(["Staff"]), // Only staff can access cases directly
      ]),

    // Department - service departments (Housing, Council Tax, etc)
    Department: a
      .model({
        // Department information
        name: a.enum([
          "Homelessness",
          "Housing_Benefit",
          "Council_Tax",
          "Adults_Duty",
          "Childrens_Duty",
          "Community_Hub_Advisor",
          "General_Customer_Service",
        ]),
        estimatedWaitingTime: a.integer().required(),

        // Relationships
        cases: a.hasMany("Case", "departmentId"),
        staff: a.hasMany("Staff", "departmentId"),
        tickets: a.hasMany("Ticket", "departmentId"),
      })
      .authorization((allow) => [
        allow.groups(["Staff"]), // Staff can see all departments
      ]),

    // Ticket - represents a queue entry for a resident's visit
    Ticket: a
      .model({
        // Foreign keys
        caseId: a.id().required(),
        departmentId: a.id().required(),

        // Display information
        ticketNumber: a.string().required(),

        // Queue information
        status: a.enum(["WAITING", "COMPLETED"]),
        position: a.integer().required(),
        estimatedWaitTimeLower: a.integer().required(), // Lower bound in minutes
        estimatedWaitTimeUpper: a.integer().required(), // Upper bound in minutes
        steppedOut: a.boolean().default(false),

        // Timestamps for queue tracking
        completedAt: a.datetime(),

        // Visit notes
        notes: a.string(),

        // Relationships
        case: a.belongsTo("Case", "caseId"),
        department: a.belongsTo("Department", "departmentId"),
      })
      .secondaryIndexes((index) => [index("caseId")])
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
      .secondaryIndexes((index) => [index("caseId")])
      .authorization((allow) => [
        allow.groups(["Staff"]), // Only staff can access appointments directly
      ]),
    getDashboardStats: a
      .query()
      .returns(
        a.customType({
          waitingCount: a.integer().required(),
          steppedOutCount: a.integer().required(),
          staffCount: a.integer().required(),
          priorityCount: a.integer().required(),
        }),
      )
      .authorization((allow) => [allow.groups(["Staff"])])
      .handler(a.handler.function(getDashboardStats)),
    QueueItem: a.customType({
      ticketId: a.id().required(),
      caseId: a.id().required(),
      ticketNumber: a.string().required(),
      department: a.string().required(),
      title: a.string().required(),
      description: a.string().required(),
      priority: a.boolean().required(),
      flag: a.boolean().required(),
      position: a.integer().required(),
      notes: a.string(),
    }),
    getQueueItems: a
      .query()
      .arguments({
        departmentName: a.string(),
      })
      .returns(a.ref("QueueItem").array())
      .authorization((allow) => [allow.groups(["Staff"])])
      .handler(a.handler.function(getQueueItems)),
    ServiceStat: a.customType({
      departmentName: a.string().required(),
      waitingCount: a.integer().required(),
      longestWait: a.integer().required(),
      averageWait: a.integer().required(),
      priorityCaseCount: a.integer().required(),
      standardCaseCount: a.integer().required(),
      steppedOutCount: a.integer().required(),
      availableStaff: a.integer().required(),
    }),
    getServiceStats: a
      .query()
      .returns(a.ref("ServiceStat").array())
      .authorization((allow) => [allow.groups(["Staff"])])
      .handler(a.handler.function(getServiceStats)),
    // Custom queries and mutations (lambdas defined in amplify/functions)

    getTicketInfo: a
      .query()
      .arguments({
        caseId: a.string().required(),
      })
      .returns(
        a.customType({
          departmentId: a.id(),
          position: a.integer(),
          estimatedWaitTimeLower: a.integer(),
          estimatedWaitTimeUpper: a.integer(),
        }),
      )
      .authorization((allow) => [allow.guest()])
      .handler(a.handler.function(getTicketInfo)),

    calculateDepartmentQueue: a
      .mutation()
      .arguments({
        departmentId: a.string().required(),
      })
      .returns(a.boolean())
      .authorization((allow) => [allow.guest()])
      .handler(a.handler.function(calculateDepartmentQueue)),

    adjustQueuePosition: a
      .mutation()
      .arguments({
        ticketId: a.string().required(),
        newPosition: a.integer().required(),
      })
      .returns(a.boolean())
      .authorization((allow) => [allow.groups(["Staff"])])
      .handler(a.handler.function(adjustQueuePosition)),

    markTicketSeen: a
      .mutation()
      .arguments({
        ticketId: a.string().required(),
      })
      .returns(a.boolean())
      .authorization((allow) => [allow.groups(["Staff"])])
      .handler(a.handler.function(markTicketSeen)),

    setCasePriority: a
      .mutation()
      .arguments({
        caseId: a.string().required(),
        priority: a.boolean().required(),
      })
      .returns(a.boolean())
      .authorization((allow) => [allow.groups(["Staff"])])
      .handler(a.handler.function(setCasePriority)),

    flagCaseSafeguarding: a
      .mutation()
      .arguments({
        caseId: a.string().required(),
        flagged: a.boolean().required(),
      })
      .returns(a.boolean())
      .authorization((allow) => [allow.groups(["Staff"])])
      .handler(a.handler.function(flagCaseSafeguarding)),

    submitEnquiry: a
      .mutation()
      .arguments({
        input: a.customType({
          departmentId: a.id().required(),

          firstName: a.string(),
          middleName: a.string(),
          lastName: a.string(),
          preferredName: a.string(),
          email: a.string(),
          phoneCountry: a.string(),
          phone: a.string(),
          dob: a.string(),

          addressLine1: a.string(),
          addressLine2: a.string(),
          addressLine3: a.string(),
          townOrCity: a.string(),
          postcode: a.string(),

          pronouns: a.string(),
          pronounsOtherText: a.string(),

          enquiry: a.string().required(),
          otherEnquiryText: a.string(),

          childrenCount: a.string(),

          hasDisabilityOrSensory: a.boolean(),
          disabilityType: a.string(),

          householdSize: a.string(),

          domesticAbuse: a.boolean(),
          safeToContact: a.string(),
          safeContactNotes: a.string(),

          ageRange: a.string(),

          urgent: a.string(),
          urgentReason: a.string(),
          urgentReasonOtherText: a.string(),

          additionalInfo: a.string(),

          proceed: a.string().required(),

          supportNeeds: a.string().array(),

          supportNotes: a.string(),
          otherSupport: a.string(),

          contactMethod: a.string(),

          appointmentDateIso: a.string(),
          appointmentTime: a.string(),
        }),
      })
      .returns(
        a.customType({
          ok: a.boolean().required(),
          referenceNumber: a.string(),
          ticketNumber: a.string(),
          errorCode: a.string(),
          errorMessage: a.string(),
        }),
      )
      .authorization((allow) => [
        allow.guest(),
        allow.authenticated(),
        allow.authenticated("identityPool"),
      ]) // Allow both guests and authenticated users to submit enquiries
      .handler(a.handler.function(submitEnquiry)),

    getAvailableAppointmentTimes: a
      .query()
      .arguments({
        departmentId: a.id().required(),
        dateIso: a.string().required(),
      })
      .returns(
        a.customType({
          availableTimes: a.string().array().required(),
        }),
      )
      .authorization((allow) => [
        allow.guest(),
        allow.authenticated(),
        allow.authenticated("identityPool"),
      ])
      .handler(a.handler.function(getAvailableAppointmentTimes)),

    getSubmissionReceipt: a
      .query()
      .arguments({
        referenceNumber: a.string().required(),
      })
      .returns(
        a.customType({
          found: a.boolean().required(),
          errorMessage: a.string(),
          createdAt: a.datetime(),
          referenceNumber: a.string(),
          receiptType: a.string(),
          ticketNumber: a.string(),
          appointmentDateIso: a.string(),
          appointmentTime: a.string(),
          departmentName: a.string(),
        }),
      )
      .authorization((allow) => [
        allow.guest(),
        allow.authenticated(),
        allow.authenticated("identityPool"),
      ])
      .handler(a.handler.function(getSubmissionReceipt)),
  })
  .authorization((allow) => [
    allow.resource(submitEnquiry).to(["query", "mutate"]),
    allow.resource(getAvailableAppointmentTimes).to(["query"]),
    allow.resource(getSubmissionReceipt).to(["query"]),
    allow.resource(postConfirmation),
    allow.resource(calculateDepartmentQueue),
    allow.resource(getTicketInfo),
    allow.resource(notifyResident),
    allow.resource(getServiceStats),
    allow.resource(getDashboardStats),
    allow.resource(adjustQueuePosition),
    allow.resource(getQueueItems),
    allow.resource(markTicketSeen),
    allow.resource(setCasePriority),
    allow.resource(flagCaseSafeguarding),
  ]);
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "identityPool",
  },
});
