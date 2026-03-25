# ResidentsPath

This README provides the main repository guide, including access instructions, file information, authorship, testing information, and links to related project documents.

## Authors

The table below summarises the main contribution areas associated with each contributor.

| Author | Main contribution areas |
| --- | --- |
| [Jacob Whiting](https://github.com/JacobSW1) | Resident form, submission logic, shared form schema, follow-up submissions, appointment booking and appointment reference backend, and related testing |
| [Hasnain Naqvi](https://github.com/hasnainn19) | Backend setup, data schema, authentication, notifications, backend integration, and related testing |
| [Naomi Quartsin](https://github.com/NQuartsin) | Reference page frontend, QR scanning, ticket and reference lookup, and related testing |
| [Romina Hosseinkhani](https://github.com/RominaKCL) | User dashboard, translations, nav bar, text-to-speech functionality, and related testing |
| [Abu-Bakarr Jalloh](https://github.com/jall0h) | Staff dashboard, queue management, case views, staff queue actions, and related testing |

## Access and Installation

### Live Demo

- [ResidentsPath live demo](https://www.residentspath.uk)

### Deployed Demo Staff Accounts

The deployed version already includes pre-created staff accounts:

- `StaffAccount1@residentspath.com`
- `StaffAccount2@residentspath.com`
- `StaffAccount3@residentspath.com`

Password for all three staff accounts: `Testaccount123*`

### Local Setup

Prerequisites:

- Node.js 20.19 or newer
- `npm`
- [AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS access if you want to run the Amplify backend locally

Install and run:

```bash
npm install
aws login
npx ampx sandbox
npx ampx sandbox seed
npm run dev
```

Notes:

- You need to sign in to AWS locally before running the Amplify sandbox commands. This project has been run using `aws login`.
- `npx ampx sandbox` provisions or updates the Amplify sandbox backend and generates `amplify_outputs.json`.
- `npx ampx sandbox seed` seeds the department data used by the prototype within the sandbox.
- On the production demo deployment, seeded tickets are created every day at midnight UTC.
- The frontend expects `amplify_outputs.json` to exist when the app starts.

### Cognito Group Setup For Local Deployments

Newly registered users are added to the `Residents` Cognito group automatically. To use staff-only features or Hounslow House device-only features, users must be placed in the correct Cognito group manually through the Cognito Console.


- `Staff` is required for the protected staff pages, including the staff dashboard, queue management, and case management. Staff users also have the ability to check-in appointments and can create an unlimited number of additional appointments for a case.
- `HounslowHouseDevices` is required for accounts which simulate the behaviour of devices at Hounslow House, which would be able to check-in appointments from the reference page.


To set this up in the Cognito Console:

1. Open AWS Cognito and go to the user pool for this deployment.
2. Open `User management` and then `Users`.
3. Select the user account that should act as a staff member or shared device account.
4. Add it to the `Staff` or `HounslowHouseDevices` group as needed.
5. If the user was already signed in when the group was assigned, you may need to sign out and sign back in so the updated group membership appears in the token claims.

Note:

For local sandbox setups, the generated `amplify_outputs.json` file contains the Cognito user pool ID under `auth.user_pool_id`.

## Testing

### How to Run Tests

Run the full test suite with:

```bash
npm test
```

### Coverage Summary

Latest recorded coverage summary:

![Coverage summary 1](tests/coverage_report/Coverage1.png)

![Coverage summary 2](tests/coverage_report/Coverage2.png)

If coverage is generated locally, the full HTML report can be opened from [coverage/index.html](coverage/index.html).

### Automated Testing Rationale

The testing approach focused mainly on unit testing non-trivial frontend behaviour, shared validation rules, and backend behaviour, including edge cases where necessary. The aim was to achieve high coverage wherever practical, with only very small or trivial logic left untested.

## Help and Support

This prototype does not include a user manual. Instead, guidance is built into the interface so users are told what to do as they move through the main journeys:

- The resident form is divided into clear steps, with navigation controls and page content that explain what information is being requested.
- Inline validation and error messages tell users when required information is missing or when a submission step has failed.
- `SubmissionReceipt` provides a record of the submitted ticket, case, or appointment reference and explains how these details can be used later on the `ReferencePage`.
- The staff dashboard, queue page, and case-management views label the main controls directly so staff can move between overview, queue, and case records without separate instructions.
- Staff actions that change queue order or case state use visible action buttons and confirmation prompts so the effect of each control is clearer before it is applied.

## Related Documents

- `CHANGELOG.md` contains the separate major milestones and version timeline, including where feedback was implemented into the design.
- `QA_TESTING.md` contains a manual quality assurance checklist for the prototype.
- `RISK_ANALYSIS.md` contains the prototype-specific risk analysis and mitigation summary.
- `user-testing/USER_TESTING_METHODS.md` contains the user testing method, survey, and results summary.
- The user testing response data can be found in `user-testing/ResidentsPathUsabilityQuestionnaire-FormResponses.csv`.

## Incomplete Implementation

- Translation support is not available across all pages. In particular, the resident form is only partially translated.
- Text-to-speech support is only available in English.
- Mobile UI support is only implemented for the resident form. The reference page, dashboards, and staff workflows all require a desktop or laptop to use.
- Staff accounts cannot sign up through the prototype and must be created or assigned through the AWS Cognito Console.

## Repository Structure and File Inventory

The tables below cover files included in the repository. Generated files created during install, build, or sandbox provisioning are not listed.

#### Project Documents

| Path | Information |
| --- | --- |
| `README.md` | Main repository guide |
| `CHANGELOG.md` | Development timeline and feedback-driven change record |
| `QA_TESTING.md` | Basic manual quality-assurance checklist for the prototype |
| `RISK_ANALYSIS.md` | Risk analysis and mitigation summary for the implemented prototype |
| `user-testing/USER_TESTING_METHODS.md` | User-testing method, survey, and results summary |
| `user-testing/ResidentsPathUsabilityQuestionnaire-FormResponses.csv` | Raw questionnaire responses collected during user testing |

#### Root, Configuration, and Static Files

| Path | Information |
| --- | --- |
| `LICENSE` | Licence for the submitted code |
| `.gitignore` | Git ignore rules |
| `package.json` | Root package manifest and scripts |
| `package-lock.json` | Root dependency lockfile |
| `tsconfig.json` | Base TypeScript configuration |
| `tsconfig.app.json` | Frontend TypeScript configuration |
| `tsconfig.node.json` | Node and tooling TypeScript configuration |
| `vite.config.ts` | Vite build and test configuration |
| `eslint.config.js` | ESLint configuration |
| `.github/workflows/ci.yml` | GitHub Actions workflow for running the project checks in continuous integration |
| `amplify.yml` | Amplify deployment configuration |
| `index.html` | Vite application HTML entry point |
| `public/vite.svg` | Default Vite static asset |
| `public/locales/en/default.json` | English localisation strings |
| `public/locales/cy/default.json` | Welsh localisation strings |
| `public/locales/fa/default.json` | Persian localisation strings |
| `public/locales/pa/default.json` | Punjabi localisation strings |
| `public/locales/pl/default.json` | Polish localisation strings |

#### Shared Files

| Path | Information |
| --- | --- |
| `shared/formSchema.ts` | Shared form validation and submission rules |
| `shared/referenceNumbers.ts` | Shared reference-number generation and parsing logic |
| `shared/departmentCodes.ts` | Shared department code definitions |

#### Frontend Setup, Theme, Layout, and Utility Files

| Path | Information |
| --- | --- |
| `src/main.tsx` | Frontend bootstrap and Amplify configuration |
| `src/routes.tsx` | Main application routes |
| `src/i18n.js` | Frontend localisation setup |
| `src/Constants/AmplifyTheme.tsx` | Amplify UI theme customisation |
| `src/Constants/Theme.tsx` | Main Material UI theme |
| `src/layouts/StaffLayout.tsx` | Shared staff-page layout |
| `src/utils/getDataAuthMode.ts` | Helper for choosing Amplify data auth mode |
| `src/assets/react.svg` | Default React static asset |

#### Frontend Component Files

##### `src/components`

| Path | Information |
| --- | --- |
| `BookingPanel.tsx` | Appointment selection and availability component |
| `ContactDetailsDialog.tsx` | Contact-details dialog component |
| `LanguageSupportButton.tsx` | Language support button component |
| `LoadingSpinner.tsx` | Shared loading indicator component |
| `NavBar.tsx` | Main navigation bar |
| `TextToSpeechButton.tsx` | Text-to-speech trigger component |

##### `src/components/FormPageComponents`

| Path | Information |
| --- | --- |
| `FormPrivacyNotice.tsx` | Form privacy notice component |
| `FormStepLayout.tsx` | Shared form step layout |
| `LeftCheckRow.tsx` | Left-aligned check row for form summaries |
| `LongTextSection.tsx` | Long text display component for form pages |
| `OptionTile.tsx` | Selectable tile component for form options |
| `outlinedInfoAlertSx.ts` | Shared form alert styling helper |
| `PrivacyNoticeDialog.tsx` | Privacy notice dialog |
| `RequireFormSteps.tsx` | Step-completion guard component for form flow |
| `ResumeFromSave.tsx` | Saved-draft resume component |
| `StepActions.tsx` | Navigation controls for form steps |
| `WithTTS.tsx` | Wrapper for text-to-speech support in form content |

##### `src/components/ReferencePageComponents`

| Path | Information |
| --- | --- |
| `AppointmentOptionsDialog.tsx` | Dialog for appointment actions from the reference page |
| `ScanButton.tsx` | QR scan trigger on the reference page |

##### `src/components/StaffComponents`

| Path | Information |
| --- | --- |
| `CaseItemCard.tsx` | Staff case summary card |
| `ConfirmChangeModal.tsx` | Confirmation modal for staff actions |
| `CurrentQueueItem.tsx` | Staff queue item card with actions |
| `DetailRow.tsx` | Shared row for labelled staff details |
| `QueueRow.tsx` | Queue-summary table row component |
| `SectionCard.tsx` | Staff dashboard section card |
| `StaffNavItem.tsx` | Item in the staff navigation |
| `StaffNavbar.tsx` | Staff navigation bar |
| `StatCard.tsx` | Staff statistics card |

##### `src/components/SubmissionReceiptComponents`

| Path | Information |
| --- | --- |
| `ReceiptBody.tsx` | Main body of the submission receipt |
| `ReceiptDetailsCard.tsx` | Receipt details card |
| `ReceiptHeaderCard.tsx` | Receipt header card |
| `ReceiptQrCard.tsx` | Receipt QR-code card |

#### Frontend Page, Context, Hook, Guard, and Form Model Files

##### `src/pages`

| Path | Information |
| --- | --- |
| `AccessDenied.tsx` | Displays the fallback screen for users who reach a route they are not allowed to access |
| `AuthPage.tsx` | Handles resident and staff sign-in and routes users into the correct flow |
| `CheckInConfirmation.tsx` | Shows the confirmation state after an appointment has been checked in successfully |
| `LandingPage.tsx` | Provides the main entry point into the prototype and directs residents to the next step |
| `ReferencePage.tsx` | Lets users enter or scan references to look up queue and appointment information |
| `StaffCaseDetails.tsx` | Shows the full details for an individual case and supports staff updates |
| `StaffCaseManagementPage.tsx` | Lists staff cases and provides navigation into individual case records |
| `StaffDashboard.tsx` | Shows headline staff metrics and entry points into the staff pages |
| `StaffQueuePage.tsx` | Displays the live queue and lets staff reorder, prioritise, flag, and complete queue items |
| `UserDashboard.tsx` | Shows a resident's current queue or appointment status, wait information, and notification settings |

##### `src/pages/Form`

| Path | Information |
| --- | --- |
| `Actions.tsx` | Shows queue information and, when applicable, the embedded appointment-booking panel for the resident's selected next step |
| `EnquirySelection.tsx` | Collects the resident's enquiry and routes them into the appropriate branch of the form |
| `ExistingCaseFollowUp.tsx` | Collects a follow-up submission for residents who already have an existing case |
| `FormEntry.tsx` | Determines how the resident enters the form flow, including new and follow-up journeys |
| `FormLayout.tsx` | Provides shared structure, navigation, and styling across the multi-step form |
| `PersonalDetails.tsx` | Collects personal, contact, and support information needed for the submission |
| `ReviewAndSubmit.tsx` | Presents completed answers for review and triggers final submission to the backend |
| `SubmissionReceipt.tsx` | Displays the resulting case, ticket, or appointment reference details after submission |

##### `src/pages/Form/data`

| Path | Information |
| --- | --- |
| `enquiries.ts` | Enquiry definitions used in the form |
| `languages.ts` | Language options used in the form |

##### `src/pages/Form/model`

| Path | Information |
| --- | --- |
| `buildSubmitEnquiryPayload.ts` | Form data to submission-payload mapping |
| `draftStorage.ts` | Form draft persistence logic |
| `enquirySelectionLogic.ts` | Enquiry selection branching logic |
| `fieldMeta.ts` | Metadata for form fields |
| `formFieldTypes.ts` | Type definitions for form state |
| `getEnquirySelectionState.ts` | Derived state for enquiry selection |
| `initialState.ts` | Initial form state values |

##### `src/context`

| Path | Information |
| --- | --- |
| `FormWizardProvider.tsx` | Stores form state, controls step progression, and manages draft resume behaviour |

##### `src/hooks`

| Path | Information |
| --- | --- |
| `useAppointmentReferenceActions.ts` | Wraps the check-in and cancellation actions available from an appointment reference |
| `useAuth.ts` | Exposes the current authentication state and sign-in related helpers |
| `useCaseDetails.ts` | Fetches and subscribes to the data needed for the staff case-details view |
| `useCases.ts` | Fetches and shapes the data shown in the staff case-management list |
| `useCheckReferenceNumber.ts` | Validates a reference number and loads the matching ticket or appointment details |
| `useDashboardStats.ts` | Loads the summary metrics displayed on the staff dashboard |
| `useQueueItems.ts` | Fetches and refreshes the live queue items used in the staff queue view |
| `useServiceStats.ts` | Loads per-service statistics used in staff reporting views |
| `useTicketQueueInfo.ts` | Loads a resident's current queue position and estimated wait details |
| `useUser.ts` | Loads the current user's stored profile and preference data |

##### `src/guards`

| Path | Information |
| --- | --- |
| `RequireAuth.tsx` | Authenticated-route guard |
| `RequireGuest.tsx` | Guest-only route guard |
| `RequireRole.tsx` | Role-based route guard |

#### Amplify Backend Files

##### `amplify`

| Path | Information |
| --- | --- |
| `README.md` | Amplify-specific documentation |
| `package.json` | Amplify package manifest |
| `tsconfig.json` | Amplify TypeScript configuration |
| `backend.ts` | Main Amplify backend definition |
| `auth/resource.ts` | Authentication resource configuration |
| `data/resource.ts` | Amplify data schema |
| `i18n/amplifyTranslations.ts` | Amplify UI translation customisation |
| `seed/seed.ts` | Seed script for backend data |

##### `amplify/functions`

| Path | Information |
| --- | --- |
| `adjustQueuePosition/handler.ts` | Reorders waiting tickets within a department queue and persists the updated positions |
| `adjustQueuePosition/resource.ts` | Amplify resource definition for queue-position adjustment |
| `cancelAppointmentByReference/handler.ts` | Cancels an appointment when a valid appointment reference is supplied from the reference flow |
| `cancelAppointmentByReference/resource.ts` | Amplify resource definition for appointment cancellation by reference |
| `checkInAppointmentByReference/handler.ts` | Marks an appointment as checked in using the appointment reference entered or scanned by the user |
| `checkInAppointmentByReference/resource.ts` | Amplify resource definition for appointment check-in by reference |
| `checkTicketNumber/handler.ts` | Checks whether a resident-facing ticket number exists and is valid for the current day |
| `checkTicketNumber/resource.ts` | Amplify resource definition for ticket-number validation |
| `cleanupEnquiryState/handler.ts` | Releases reserved state after failed or abandoned submissions so references, slots, and queue positions are not left stuck |
| `cleanupEnquiryState/helpers.ts` | Shared helper logic used by the enquiry-state cleanup flow |
| `cleanupEnquiryState/resource.ts` | Amplify resource definition for enquiry-state cleanup |
| `dailySeedQueue/handler.ts` | Seeds fresh queue data for the start of a new day in development or demo environments |
| `dailySeedQueue/resource.ts` | Amplify resource definition for daily queue seeding |
| `flagCaseSafeguarding/handler.ts` | Updates the safeguarding flag used by staff to mark cases that may present a risk |
| `flagCaseSafeguarding/resource.ts` | Amplify resource definition for safeguarding flag updates |
| `getAvailableAppointmentTimes/handler.ts` | Returns bookable appointment slots for the chosen service and date |
| `getAvailableAppointmentTimes/resource.ts` | Amplify resource definition for appointment-time lookup |
| `getCaseDetails/handler.ts` | Loads the full case record and related detail needed for the staff case-details page |
| `getCaseDetails/resource.ts` | Amplify resource definition for case-detail retrieval |
| `getCaseFollowUp/handler.ts` | Loads the data needed to start a follow-up submission against an existing case |
| `getCaseFollowUp/resource.ts` | Amplify resource definition for existing-case follow-up retrieval |
| `getDashboardStats/handler.ts` | Calculates the summary metrics shown on the staff dashboard |
| `getDashboardStats/resource.ts` | Amplify resource definition for dashboard statistics |
| `getDepartmentQueueStatus/handler.ts` | Returns current queue size and timing information for the selected department |
| `getDepartmentQueueStatus/resource.ts` | Amplify resource definition for department queue status |
| `getQueueItems/handler.ts` | Loads the live queue items displayed in the staff queue-management view |
| `getQueueItems/resource.ts` | Amplify resource definition for queue-item retrieval |
| `getServiceStats/handler.ts` | Calculates service-level statistics used in the staff views |
| `getServiceStats/resource.ts` | Amplify resource definition for service statistics |
| `getSubmissionReceipt/handler.ts` | Builds the submission receipt returned after a resident completes a form |
| `getSubmissionReceipt/resource.ts` | Amplify resource definition for submission receipt retrieval |
| `getTicketInfo/handler.ts` | Returns the latest queue status information for a valid ticket reference |
| `getTicketInfo/resource.ts` | Amplify resource definition for ticket information retrieval |
| `handleSteppedOut/handler.ts` | Updates the stepped-out state when a resident temporarily leaves or rejoins the queue |
| `handleSteppedOut/resource.ts` | Amplify resource definition for stepped-out handling |
| `hello/handler.ts` | Example Lambda retained from setup and not part of the main prototype workflow |
| `hello/resource.ts` | Amplify resource definition for the example Lambda |
| `markTicketSeen/handler.ts` | Marks a queue item as completed once staff have seen the resident |
| `markTicketSeen/resource.ts` | Amplify resource definition for marking tickets as seen |
| `notifyResident/handler.ts` | Sends notifications to residents about queue progress and related updates |
| `notifyResident/resource.ts` | Amplify resource definition for resident notifications |
| `onTicketCompleted/handler.ts` | Runs follow-up processing after a ticket is completed, including queue recalculation hooks |
| `onTicketCompleted/resource.ts` | Amplify resource definition for ticket-completion processing |
| `postConfirmation/handler.ts` | Creates or updates the application user record after Cognito sign-up confirmation |
| `postConfirmation/resource.ts` | Amplify resource definition for post-confirmation user setup |
| `setCasePriority/handler.ts` | Updates whether a case should be treated as priority in staff workflows |
| `setCasePriority/resource.ts` | Amplify resource definition for case-priority updates |
| `submitCaseFollowUp/handler.ts` | Creates a follow-up submission against an existing case, including any related ticket or appointment changes |
| `submitCaseFollowUp/resource.ts` | Amplify resource definition for follow-up submissions |
| `submitEnquiry/handler.ts` | Processes a new resident submission and creates the resulting case, ticket, or appointment records |
| `submitEnquiry/resource.ts` | Amplify resource definition for enquiry submissions |
| `toggleNotifications/handler.ts` | Updates a resident's notification preferences from the dashboard flow |
| `toggleNotifications/resource.ts` | Amplify resource definition for notification preference changes |

##### `amplify/functions/utils`

| Path | Information |
| --- | --- |
| `amplifyClient.ts` | Shared helper for creating Amplify data clients inside backend functions |
| `caseAccess.ts` | Shared rules for checking whether a user can access a case |
| `cognitoClient.ts` | Shared helper for creating the Cognito client used by backend functions |
| `endUserMessagingClient.ts` | Shared helper for sending end-user messages through the configured messaging service |
| `enquiriesStateTable.ts` | Shared helpers for reserving and releasing transient submission state during form processing |
| `getAppointmentReferenceDetails.ts` | Shared logic for resolving appointment details from a supplied reference |
| `identityGroups.ts` | Shared helpers for interpreting user identity groups and roles |
| `queueWaitTimes.ts` | Shared logic for estimating and formatting queue wait times |
| `recalculateDepartmentQueue.ts` | Shared logic for recalculating queue positions and wait estimates within a department |
| `runCleanup.ts` | Shared wrapper for running cleanup routines safely after failures |
| `sesClient.ts` | Shared helper for creating the SES client used for outbound email |
| `submissionShared.ts` | Shared submission logic reused by the new-submission and follow-up handlers |

#### Frontend Test Files

##### `tests`

| Path | Information |
| --- | --- |
| `tsconfig.json` | TypeScript configuration for the test suite |
| `setup/setup.frontend.ts` | Shared Vitest and Testing Library setup for frontend tests |
| `shared/formSchema.test.ts` | Tests for the shared form schema |
| `shared/referenceNumbers.test.ts` | Tests for shared reference-number logic |

##### `tests/src/components`

| Path | Information |
| --- | --- |
| `BookingPanel.test.tsx` | Tests for the booking panel |
| `LanguageSupportButton.test.tsx` | Tests for the language support button |
| `TextToSpeechButton.test.tsx` | Tests for the text-to-speech button |

##### `tests/src/components/FormPageComponents`

| Path | Information |
| --- | --- |
| `FormPrivacyNotice.test.tsx` | Tests for the form privacy notice |
| `RequireFormSteps.test.tsx` | Tests for required form-step behaviour |
| `ResumeFromSave.test.tsx` | Tests for resuming a saved draft |

##### `tests/src/components/ReferencePageComponents`

| Path | Information |
| --- | --- |
| `AppointmentOptionsDialog.test.tsx` | Tests for the appointment options dialog on the reference page |
| `ScanButton.test.tsx` | Tests for the scan button |

##### `tests/src/components/StaffComponents`

| Path | Information |
| --- | --- |
| `CaseItemCard.test.tsx` | Tests for the staff case item card |
| `ConfirmChangeModal.test.tsx` | Tests for the staff confirmation modal |
| `CurrentQueueItem.test.tsx` | Tests for the current queue item component |
| `QueueRow.test.tsx` | Tests for the queue row component |
| `SectionCard.test.tsx` | Tests for the staff section card |
| `StaffNavItem.test.tsx` | Tests for the staff navigation item |
| `StaffNavbar.test.tsx` | Tests for the staff navigation bar |
| `StatCard.test.tsx` | Tests for the staff statistics card |

##### `tests/src/components/SubmissionReceiptComponents`

| Path | Information |
| --- | --- |
| `ReceiptBody.test.tsx` | Tests for the receipt body component |
| `ReceiptDetailsCard.test.tsx` | Tests for the receipt details card |
| `ReceiptHeaderCard.test.tsx` | Tests for the receipt header card |
| `ReceiptQrCard.test.tsx` | Tests for the receipt QR card |

##### `tests/src/guards`

| Path | Information |
| --- | --- |
| `helpers.ts` | Test helpers for route-guard tests |
| `RequireAuth.test.tsx` | Tests for the authenticated-route guard |
| `RequireGuest.test.tsx` | Tests for the guest-route guard |
| `RequireRole.test.tsx` | Tests for the role-route guard |

##### `tests/src/hooks`

| Path | Information |
| --- | --- |
| `useAppointmentReferenceActions.test.tsx` | Tests for the appointment reference actions hook |
| `useAuth.test.ts` | Tests for the auth hook |
| `useCaseDetails.test.ts` | Tests for the case-details hook |
| `useCheckReferenceNumber.test.tsx` | Tests for reference-number checking |
| `useDashboardStats.test.ts` | Tests for the dashboard stats hook |
| `useQueueItems.test.tsx` | Tests for the queue-items hook |
| `useServiceStats.test.ts` | Tests for the service-stats hook |

##### `tests/src/utils`

| Path | Information |
| --- | --- |
| `getDataAuthMode.test.ts` | Tests for data auth mode selection |

##### `tests/src/pages`

| Path | Information |
| --- | --- |
| `ReferencePage.test.tsx` | Tests for the reference page |
| `UserDashboard.test.tsx` | Tests for the resident dashboard |

##### `tests/src/pages/Form`

| Path | Information |
| --- | --- |
| `Actions.test.tsx` | Tests for the actions form step |
| `EnquirySelection.test.tsx` | Tests for the enquiry selection page |
| `ExistingCaseFollowUp.test.tsx` | Tests for the existing-case follow-up page |
| `FormEntry.test.tsx` | Tests for the form entry page |
| `PersonalDetails.test.tsx` | Tests for the personal-details page |
| `ReviewAndSubmit.test.tsx` | Tests for the review and submit page |
| `SubmissionReceipt.test.tsx` | Tests for the submission receipt page |

##### `tests/src/pages/Form/model`

| Path | Information |
| --- | --- |
| `buildSubmitEnquiryPayload.test.ts` | Tests for form submission payload building |
| `draftStorage.test.ts` | Tests for draft-storage behaviour |
| `enquirySelectionLogic.test.ts` | Tests for enquiry selection logic |
| `fieldMeta.test.ts` | Tests for form field metadata |
| `getEnquirySelectionState.test.ts` | Tests for derived enquiry selection state |

#### Backend Test Files

##### `tests/amplify/functions`

| Path | Information |
| --- | --- |
| `adjustQueuePosition.test.ts` | Tests for queue-position adjustment |
| `cancelAppointmentByReference.test.ts` | Tests for appointment cancellation by reference |
| `checkInAppointmentByReference.test.ts` | Tests for appointment check-in by reference |
| `checkTicketNumber.test.ts` | Tests for ticket-number checking |
| `cleanupEnquiryState/cleanupEnquiryState-helpers.test.ts` | Tests for enquiry-state cleanup helpers |
| `cleanupEnquiryState/cleanupEnquiryState.test.ts` | Tests for enquiry-state cleanup flow |
| `flagCaseSafeguarding.test.ts` | Tests for safeguarding flag updates |
| `getAvailableAppointmentTimes.test.ts` | Tests for appointment-time lookup |
| `getCaseDetails.test.ts` | Tests for case-detail retrieval |
| `getCaseFollowUp.test.ts` | Tests for existing-case follow-up retrieval |
| `getDashboardStats.test.ts` | Tests for dashboard statistics retrieval |
| `getDepartmentQueueStatus.test.ts` | Tests for department queue status retrieval |
| `getQueueItems.test.ts` | Tests for queue-item retrieval |
| `getServiceStats.test.ts` | Tests for service statistics retrieval |
| `getSubmissionReceipt.test.ts` | Tests for submission receipt retrieval |
| `getTicketInfo.test.ts` | Tests for ticket information retrieval |
| `handleSteppedOut.test.ts` | Tests for stepped-out handling |
| `markTicketSeen.test.ts` | Tests for marking tickets as seen |
| `notifyResident.test.ts` | Tests for resident notifications |
| `onTicketCompleted.test.ts` | Tests for ticket-completion follow-up |
| `postConfirmation.test.ts` | Tests for post-confirmation user setup |
| `setCasePriority.test.ts` | Tests for case-priority updates |
| `submitCaseFollowUp.test.ts` | Tests for follow-up submission handling |
| `submitEnquiry.test.ts` | Tests for enquiry submission handling |
| `toggleNotifications.test.ts` | Tests for notification preference toggling |

##### `tests/amplify/utils`

| Path | Information |
| --- | --- |
| `caseAccess.test.ts` | Tests for case-access utilities |
| `enquiriesStateTable.test.ts` | Tests for enquiry-state table utilities |
| `getAppointmentReferenceDetails.test.ts` | Tests for appointment-reference helper logic |
| `identityGroups.test.ts` | Tests for identity-group utilities |
| `recalculateDepartmentQueue.test.ts` | Tests for queue recalculation logic |
| `runCleanup.test.ts` | Tests for cleanup helper execution |
| `submissionShared.test.ts` | Tests for shared submission utilities |
