# ResidentsPath QA Testing

## Purpose

This document records a basic set of manual quality-assurance checks for the ResidentsPath prototype.

These checks can be repeated in either a sandbox environment or the deployed demo.

## Test Environment

| Item | Details |
| --- | --- |
| Environment | [sandbox / deployed demo] |
| Test date | [dd month yyyy] |
| Tester | [name] |
| Build / commit | [commit hash or version] |

## Manual QA Checks

| Test ID | Check | Steps | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- | --- |
| QA-01 | Resident queue submission | 1. Open the form. 2. Start a new enquiry that routes to the digital queue. 3. Complete the required details. 4. Submit the form. | A submission receipt is shown with a case reference number and queue ticket information. | [to be completed] | [Pass / Fail / Blocked] |
| QA-02 | Resident appointment booking | 1. Open the form. 2. Start a new enquiry for appointment booking. 3. Choose an available slot. 4. Submit the form. | A submission receipt is shown with appointment date, time, and the reference number. | [to be completed] | [Pass / Fail / Blocked] |
| QA-03 | Reference page lookup | 1. Open the reference page. 2. Enter a valid queue or appointment reference number. 3. Submit the lookup. | The correct queue or appointment information is returned. | [to be completed] | [Pass / Fail / Blocked] |
| QA-04 | Appointment cancellation | 1. Open the reference page. 2. Enter a valid appointment reference number. 3. Open the appointment actions dialog. 4. Cancel the appointment. | The appointment is cancelled successfully and a clear success message is shown. | [to be completed] | [Pass / Fail / Blocked] |
| QA-05 | Appointment check-in | 1. Sign in with a staff or Hounslow House device account. 2. Open the reference page. 3. Enter a valid appointment reference number. 4. Open the appointment actions dialog. 5. Check in the appointment. | The appointment is checked in successfully and the user is taken to the check-in confirmation page. | [to be completed] | [Pass / Fail / Blocked] |
| QA-06 | Staff queue management | 1. Sign in with a staff account. 2. Open the staff queue page. 3. Reorder and prioritise a queue item, and mark it as seen. | The queue updates correctly and the change is visible in the staff interface. | [to be completed] | [Pass / Fail / Blocked] |
| QA-07 | Role-based access | 1. Sign in with a resident account. 2. Attempt to open a staff-only page. 3. Sign in with a staff account and open the same page. | Resident access is blocked. Staff access succeeds. | [to be completed] | [Pass / Fail / Blocked] |
| QA-08 | Save and resume form | 1. Start a new form. 2. Enter some details. 3. Use `Save and continue later`. 4. Return to the form. 5. Continue the saved form or start a new one. | The saved draft can be resumed correctly, or cleared if the user chooses to start again. | [to be completed] | [Pass / Fail / Blocked] |
| QA-09 | Queue notifications | 1. Open the user dashboard for a queued case. 2. Enable notifications. 3. Confirm the success message appears. 4. Disable notifications again. | Notification preferences update successfully and the dashboard reflects the current notification state. | [to be completed] | [Pass / Fail / Blocked] |
| QA-10 | QR scan path | 1. Open the reference page. 2. Start the QR scan flow. 3. Scan a valid queue or appointment QR code. 4. Review the returned result. | The scanned QR code is accepted and the correct queue or appointment information is shown. | [to be completed] | [Pass / Fail / Blocked] |
| QA-11 | Language switcher and translated content | 1. Open a page with the language support button, such as the landing page or reference page. 2. Change the language using the language support menu. 3. Confirm that visible translated text updates. 4. Continue using the page after the language change. | The language switcher changes supported interface text without breaking the current page or user journey. Any untranslated content remains usable even if not fully localised. | [to be completed] | [Pass / Fail / Blocked] |

## Notes

- Record any defects found during testing and link them to a later fix or commit where possible.
- Use `Pass`, `Fail`, or `Blocked` when completing the status column.


## Completed Test Environment

| Item | Details |
| --- | --- |
| Environment | deployed version |
| Test date | 25 March 2026 |
| Tester | Jacob Whiting |
| Build / commit | `70962bb` (`main`) |

## Executed QA Record

| Test ID | Actual result | Status |
| --- | --- | --- |
| QA-01 | Submission succeeded and the receipt showed a case reference number and queue ticket information. | Pass |
| QA-02 | Appointment booking succeeded and the receipt showed the appointment date, time, and reference number. | Pass |
| QA-03 | The reference number lookup returned the correct queue or appointment information. | Pass |
| QA-04 | Appointment cancellation completed successfully and a clear success message was shown. | Pass |
| QA-05 | Appointment check-in completed successfully and the check-in confirmation page was shown. | Pass |
| QA-06 | Queue actions updated correctly and the changed queue state was visible in the staff interface. | Pass |
| QA-07 | Resident access to staff-only pages was blocked, and staff access to the same pages succeeded. | Pass |
| QA-08 | The saved draft resumed correctly and could also be cleared when starting again. | Pass |
| QA-09 | Notification preferences updated successfully and the dashboard reflected the current notification state. | Pass |
| QA-10 | The QR scan flow accepted a valid code and returned the correct queue or appointment information. | Pass |
| QA-11 | The language switcher updated supported interface text without breaking the page flow. | Pass |
