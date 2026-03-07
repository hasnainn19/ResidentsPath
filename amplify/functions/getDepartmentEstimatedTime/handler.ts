// lambda/getDailyTickets.ts
import { data, type Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/data";
import { Amplify } from 'aws-amplify'

import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/getDepartmentEstimatedTime'; 

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: Schema["getDepartmentEstimatedTime"]["functionHandler"] = async (event) => {
    const { departmentName } = event.arguments;

     const { data:department  } = await client.models.Department.list({
        filter: { name: { eq: departmentName } },
    });

     if (!department || department.length === 0) {
        return null;
    }

    return {
        estimatedWaitingtTime:department[0].estimatedWaitingTime
    };
};