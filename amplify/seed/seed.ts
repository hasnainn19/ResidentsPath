import { DynamoDBClient, PutItemCommand, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import outputs from "../../amplify_outputs.json";
import { getDefaultEstimatedWaitingTime } from "../functions/utils/queueWaitTimes";

const tableName = (outputs as any).custom?.departmentTableName as string | undefined;

if (!tableName) {
  throw new Error(
    "departmentTableName not found in amplify_outputs.json. " +
    "Make sure the sandbox is running and amplify_outputs.json is up to date.",
  );
}

const DEPARTMENT_NAMES = [
  "Council_Tax_Or_Housing_Benefit",
  "Homelessness",
  "Adults_Duty",
  "Childrens_Duty",
  "Community_Hub_Advisor",
  "General_Customer_Services",
] as const;

const client = new DynamoDBClient({ region: outputs.auth.aws_region });
const now = new Date().toISOString();

for (const name of DEPARTMENT_NAMES) {
  try {
    await client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: marshall({
          id: name,
          name,
          estimatedWaitingTime: getDefaultEstimatedWaitingTime(name),
          __typename: "Department",
          createdAt: now,
          updatedAt: now,
        }),
        ConditionExpression: "attribute_not_exists(id)",
      }),
    );
    console.log(`✓ Created: ${name}`);
  } 
  catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      console.log(`- Skipped (already exists): ${name}`);
    } 
    else {
      throw error;
    }
  }
}
