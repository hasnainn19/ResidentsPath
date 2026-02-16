# ResidentsPath - AWS Amplify Backend

This directory contains the AWS Amplify Gen2 backend configuration for the ResidentsPath queue management system.

## Overview

This project uses **AWS Amplify Gen2** (CDK-based) to generate backend infrastructure:
- **AWS AppSync** - GraphQL API with real-time subscriptions
- **Amazon DynamoDB** - NoSQL database for all data models
- **Amazon Cognito** - Authentication and user management
- **AWS Lambda** - Custom business logic functions
- **AWS IAM** - Authorization and permissions (managed automatically)

## Project Structure

```
amplify/
├── auth/
│   └── resource.ts          # Cognito configuration (email login, user groups)
├── data/
│   └── resource.ts          # Data models and schema (User, Case, Ticket, Department, Staff)
├── functions/
│   ├── getTicketStatus/     # Custom Lambda: Get ticket status by ticket number
│   │   ├── resource.ts      # Lambda configuration
│   │   └── handler.ts       # Lambda implementation
│   └── hello/               # Example Lambda (can be deleted)
├── backend.ts               # Main backend configuration - registers all resources
└── README.md                # This file
```

## Prerequisites

Before working with the Amplify backend, you need:

### 1. AWS CLI v2
Install the AWS Command Line Interface version 2:
- [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

### 2. AWS Authentication
Login to AWS:

```bash
aws login
# Set region: eu-west-2
```

### 3. Node.js & npm
Ensure you have Node.js 18+ installed (Amplify Gen2 requires Node.js 18.x or later):
```bash
node --version  # Should be v18.x or higher
npm --version
```

## Data Models

### Core Models
1. **User** - Residents (both registered users and walk-ins)
2. **Case** - Issues/matters that residents need help with
3. **Department** - Service departments (Housing, Council Tax, etc.)
4. **Ticket** - Queue entries for a resident's visit
5. **Staff** - Staff members working in departments

### Relationships
- User → has many Cases
- Case → belongs to User, Department; has many Tickets
- Ticket → belongs to Case, Department
- Staff → belongs to Department
- Department → has many Cases, Tickets, Staff

All models have auto-generated fields from Amplify: `id`, `createdAt`, `updatedAt`

## Authorization Model

### User Groups
Defined in [auth/resource.ts](auth/resource.ts):
- **Staff** - Council employees
- **Residents** - Registered residents

### Security Principle
**Models are private by default. Public data is exposed only through custom Lambda queries.**

This prevents:
- Exposing internal UUIDs to guests
- Enumeration attacks on the database
- Accidental data leaks when adding new fields

## Adding a Custom Lambda Function

### When to Use Custom Lambdas
- Custom business logic (e.g., send notifications)
- Complex operations (e.g., atomic multi-model updates)
- Public-facing queries that filter sensitive data
- Integration with external services
- Background jobs

### Steps to Add a Lambda

**1. Create Lambda directory:**
```bash
mkdir -p amplify/functions/myFunction
```

**2. Create `resource.ts`:**
```typescript
import { defineFunction } from "@aws-amplify/backend"

export const myFunction = defineFunction({
  name: "myFunction",
  entry: "./handler.ts"
});
```

**3. Create `handler.ts`:**
```typescript
import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";

/**
 * Documentation for your Lambda function
 */
export const handler: Schema["myFunction"]["functionHandler"] = async (event) => {
  const { arg1, arg2 } = event.arguments;

  // Use generateClient to query Amplify data with service credentials
  const client = generateClient<Schema>({
    authMode: "identityPool"
  });

  // Your logic here
  const result = await client.models.SomeModel.list();

  return { /* your return data */ };
};
```

**4. Import in `data/resource.ts`:**
```typescript
import { myFunction } from '../functions/myFunction/resource';
```

**5. Add to schema in `data/resource.ts`:**
```typescript
const schema = a.schema({
  // ... existing models ...

  myFunction: a
    .query()  // or .mutation()
    .arguments({
      arg1: a.string().required(),
      arg2: a.integer()
    })
    .returns(a.customType({
      field1: a.string(),
      field2: a.boolean()
    }))
    .authorization((allow) => [
      allow.guest(),              // or
      allow.authenticated(),      // or
      allow.groups(["Staff"])
    ])
    .handler(a.handler.function(myFunction)),
});
```

**6. Deploy:**
```bash
npx ampx sandbox
```

## Development Workflow

### Local Development (Sandbox)
```bash
# Start local sandbox environment
npx ampx sandbox

# This creates a cloud sandbox that auto-deploys changes
# Keep this running while developing
```

### Making Schema Changes
1. Edit [data/resource.ts](data/resource.ts)
2. Save the file
3. Sandbox will automatically deploy changes
4. Frontend types are automatically regenerated

### Testing
```bash
# Run frontend dev server (separate terminal)
npm run dev

# Test with authenticated user (Staff or Resident)
# Test with guest access (no authentication)
```

## Resources

- [AWS Amplify Gen2 Documentation](https://docs.amplify.aws/gen2/)
