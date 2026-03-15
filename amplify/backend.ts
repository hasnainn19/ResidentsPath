import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { postConfirmation } from "./functions/postConfirmation/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Aws } from "aws-cdk-lib";
import { submitEnquiry } from "./functions/submitEnquiry/resource";
import { getDashboardStats } from "./functions/getDashboardStats/resource";
import { getServiceStats } from "./functions/getServiceStats/resource";
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
} from "aws-cdk-lib/aws-dynamodb";
import { getAvailableAppointmentTimes } from "./functions/getAvailableAppointmentTimes/resource";
import { getTicketInfo } from "./functions/getTicketInfo/resource";
import { getDepartmentQueueStatus } from "./functions/getDepartmentQueueStatus/resource";
import { onTicketCompleted } from "./functions/onTicketCompleted/resource";
import { notifyResident } from "./functions/notifyResident/resource";
import { cleanupEnquiryState } from "./functions/cleanupEnquiryState/resource";
import { handleSteppedOut } from "./functions/handleSteppedOut/resource";
import {
  FilterCriteria,
  FilterRule,
  StartingPosition,
} from "aws-cdk-lib/aws-lambda";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  postConfirmation,
  submitEnquiry,
  getTicketInfo,
  getDepartmentQueueStatus,
  onTicketCompleted,
  notifyResident,
  cleanupEnquiryState,
  getAvailableAppointmentTimes,
  getDashboardStats,
  getServiceStats,
  handleSteppedOut,
});

/**
 * Grant permissions to the postConfirmation Lambda to add users to Cognito groups
 *
 * Due to circular dependency issues, we cannot reference the actual ARNs of the Cognito User Pool here.
 * Instead, we hardcode the ARN patterns for these resources, which will allow the
 * Lambda to have the necessary permissions without causing deployment issues.
 *
 * Actual ARNs will look like:
 * arn:aws:cognito-idp:{region}:{accountId}:userpool/{userPoolId}
 *
 * This approach is a workaround for the limitations of the Amplify CDK when it comes to cross-referencing resources in different stacks.
 */
backend.postConfirmation.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminAddUserToGroup", // Add users to Cognito groups
    ],
    resources: [
      // backend.auth.resources.userPool.userPoolArn causes circular dependency
      `arn:aws:cognito-idp:${Aws.REGION}:${Aws.ACCOUNT_ID}:userpool/*`,
    ],
  }),
);

/**
 * Create a DynamoDB table to keep track of daily ticket numbers, claimed ticket numbers,
 * and claimed case reference numbers for the submitEnquiry function
 */
const enquiriesStateTable = new Table(backend.stack, "EnquiriesStateTable", {
  partitionKey: { name: "pk", type: AttributeType.STRING },
  sortKey: { name: "sk", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: "expiresAt",
});
enquiriesStateTable.grantReadWriteData(backend.submitEnquiry.resources.lambda);
enquiriesStateTable.grantReadData(
  backend.getAvailableAppointmentTimes.resources.lambda,
);
enquiriesStateTable.grantReadData(
  backend.getDepartmentQueueStatus.resources.lambda,
);
enquiriesStateTable.grantReadWriteData(backend.cleanupEnquiryState.resources.lambda);

backend.submitEnquiry.addEnvironment(
  "ENQUIRIES_STATE_TABLE",
  enquiriesStateTable.tableName,
);

backend.getAvailableAppointmentTimes.addEnvironment(
  "ENQUIRIES_STATE_TABLE",
  enquiriesStateTable.tableName,
);

backend.getDepartmentQueueStatus.addEnvironment(
  "ENQUIRIES_STATE_TABLE",
  enquiriesStateTable.tableName,
);

backend.cleanupEnquiryState.addEnvironment(
  "ENQUIRIES_STATE_TABLE",
  enquiriesStateTable.tableName,
);

/**
 * Access the Ticket, Case, and Appointment tables and enable DynamoDB streams
 * Amplify doesn't expose stream config directly so we go through the underlying CloudFormation resource to set it up
 */
backend.data.resources.cfnResources.amplifyDynamoDbTables["Ticket"].streamSpecification = {
  streamViewType: StreamViewType.NEW_AND_OLD_IMAGES,
};
backend.data.resources.cfnResources.amplifyDynamoDbTables["Case"].streamSpecification = {
  streamViewType: StreamViewType.NEW_AND_OLD_IMAGES,
};
backend.data.resources.cfnResources.amplifyDynamoDbTables["Appointment"].streamSpecification = {
  streamViewType: StreamViewType.NEW_AND_OLD_IMAGES,
};

const ticketTable = backend.data.resources.tables["Ticket"];
const caseTable = backend.data.resources.tables["Case"];
const appointmentTable = backend.data.resources.tables["Appointment"];

/**
 * Attach the Ticket stream to the Lambda.
 * The filter tells AWS to only invoke the Lambda for MODIFY events
 *
 * The 3 filters are mutually exclusive so the lambda doesn't fire multiple times for the same ticket update.
 * Since FilterRule doesn't support greaterThan or lessThanOrEqualTo, we use between to create the necessary ranges.
 */
backend.notifyResident.resources.lambda.addEventSource(
  new DynamoEventSource(ticketTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    bisectBatchOnError: true,
    filters: [
      // Position reaches 0 (being served)
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("MODIFY"),
        dynamodb: {
          NewImage: { position: { N: FilterRule.isEqual("0") } },
          OldImage: { position: { N: FilterRule.notEquals("0") } },
        },
      }),
      // Crosses into ≤5 min range from above 5 (and not being served)
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("MODIFY"),
        dynamodb: {
          NewImage: {
            estimatedWaitTimeLower: { N: FilterRule.between(0, 5) },
            position: { N: FilterRule.notEquals("0") },
          },
          OldImage: { estimatedWaitTimeLower: { N: FilterRule.between(6, 999) } },
        },
      }),
      // Crosses into 6–15 min range from above 15 (and not being served)
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("MODIFY"),
        dynamodb: {
          NewImage: {
            estimatedWaitTimeLower: { N: FilterRule.between(6, 15) },
            position: { N: FilterRule.notEquals("0") },
          },
          OldImage: { estimatedWaitTimeLower: { N: FilterRule.between(16, 999) } },
        },
      }),
    ]
  })
);

// Grant the Lambda permission to send SMS via End User Messaging
backend.notifyResident.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["sms-voice:SendTextMessage"],
    resources: [
      "arn:aws:sms-voice:eu-west-2:812914649610:sender-id/HOUNSLOW/GB",
    ],
  }),
);

// Grant the Lambda permission to send emails via SES
backend.notifyResident.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ses:SendEmail"],
    resources: ["*"],
  }),
);

/**
 * SMS origination identity is the ARN of the sender ID that is registered in AWS End User Messaging for sending SMS messages.
 * The Lambda specifies it when sending SMS, ensuring that messages are sent from the registered sender ID.
 */
backend.notifyResident.addEnvironment(
  "SMS_ORIGINATION_IDENTITY",
  "arn:aws:sms-voice:eu-west-2:812914649610:sender-id/HOUNSLOW/GB",
);
backend.notifyResident.addEnvironment("SENDER_EMAIL", "noreply@domain.com");

/**
 * Attach the Ticket stream to the onTicketCompleted Lambda.
 * The filter tells AWS to only invoke the Lambda for MODIFY and INSERT events
 */
backend.onTicketCompleted.resources.lambda.addEventSource(
  new DynamoEventSource(ticketTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    bisectBatchOnError: true,
    filters: [
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("MODIFY"),
      }),
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("INSERT"), // new ticket creations
      }),

    ],
  })
);


/**
 * Attach the Ticket, Case, and Appointment streams to the Lambda.
 * The filter tells AWS to only invoke the Lambda for MODIFY or REMOVE events
 *
 * Further filters can be added that target the dynamoDB record's new and old images
 */
backend.cleanupEnquiryState.resources.lambda.addEventSource(
  new DynamoEventSource(ticketTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    bisectBatchOnError: true,
    filters: [
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("MODIFY"),
      }),
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("REMOVE"),
      }),
    ],
  })
);

backend.cleanupEnquiryState.resources.lambda.addEventSource(
  new DynamoEventSource(caseTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    bisectBatchOnError: true,
    filters: [
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("MODIFY"),
      }),
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("REMOVE"),
      }),
    ],
  })
);

backend.cleanupEnquiryState.resources.lambda.addEventSource(
  new DynamoEventSource(appointmentTable, {
    startingPosition: StartingPosition.LATEST,
    batchSize: 10,
    bisectBatchOnError: true,
    filters: [
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("MODIFY"),
      }),
      FilterCriteria.filter({
        eventName: FilterRule.isEqual("REMOVE"),
      }),
    ],
  })
);

backend.cleanupEnquiryState.addEnvironment("TICKET_TABLE_NAME", ticketTable.tableName);
backend.cleanupEnquiryState.addEnvironment("CASE_TABLE_NAME", caseTable.tableName);
backend.cleanupEnquiryState.addEnvironment("APPOINTMENT_TABLE_NAME", appointmentTable.tableName);
