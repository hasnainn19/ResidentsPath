import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from '../functions/postConfirmation/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
	loginWith: {
		email: true,
	},
	groups: ['Staff', 'Residents', 'HounslowHouseDevices'],
	// Extra Cognito user attributes
	userAttributes: {
		givenName: {
			required: true,
			mutable: true
		},
		familyName: {
			required: true,
			mutable: true
		}
	},
	// Cognito Lambda triggers
	triggers: {
		postConfirmation: postConfirmation,
	}
});
