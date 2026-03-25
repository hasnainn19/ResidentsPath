# Changelog

All notable changes to this prototype are documented in this file.

## [Project Setup] - 2026-01-29

### Added

- Initial repository scaffold and project baseline (`a18a100`).

## [Prototype Foundations] - 2026-02-15 to 2026-02-19

### Added

- Landing page (`cb26c45`).
- Enquiry form (`d9eef34`).
- Initial booking page (`11d8ce6`).
- Reference page (`75423f0`).
- User dashboard (`0dabc86`).
- Text-to-speech support (`145d35f`, first introduced in `744b293`).
- AWS and Amplify setup needed to deploy the application and backend services (`5dc4801`).

## [Authentication and Staff Dashboard Foundations] - 2026-02-26 to 2026-03-04

### Added

- Resident and staff authentication (`0bab6df`).
- First staff dashboard (`e7d45e2`).
- First staff queue view (`2feb9d8`).
- Resident form submission backend (`f9a8c55`).

## [Expanded User Experience and Backend Implementation] - 2026-03-10 to 2026-03-13

### Added

- Wait-time calculation (`06721c4`).
- Queue position assignment and live wait-time updates (`3a4777e`, `bed9cb1`).
- Submission receipts (`8c60094`).
- Reference-page backend logic (`a66d285`).
- Notifications (`7b5db7b`).
- Expanded staff dashboard (`f2f2752`).

### Changed

- Resident form was updated with stronger validation, live appointment availability, and improved submission handling (`477099f`).

## [Case Management, Appointment Handling, and Accessibility] - 2026-03-15 to 2026-03-17

### Added

- Appointment check-in and cancellation (`390d3bb`).
- Case management (`d0e3bf0`).
- Staff case pages (`303b33d`).
- Submissions for existing cases (`1f86976`).
- Stepping-out support (`f7b7033`).
- Multilingual support (`bb5f022`).

## [Automated Testing Implementation] - 2026-03-17 to 2026-03-25

### Added

- Set up the automated testing suite, including coverage reporting and backend unit-test support (`edd7e6e`).
- Implemented automated testing across the prototype, covering submission and receipt flows, follow-up flows, shared form logic, form pages and components, guards, user and staff dashboard views, reference page flows, and backend workflows (`cfe6d45`, `39ad88b`, `19d720f`, `b3afba3`, `48b7493`, `2405d32`, `ac121c7`, `f9b05c3`, `03d7d49`, `95905e6`, `4052889`, `faea774`, `fd502a4`, `f8d11d0`, `dfbb614`, `fbc1662`).

### Fixed

- Fixed a validation mismatch so first-name and last-name requirements were enforced consistently (`aa22db2`, `0549195`).
- Removed dead code identified while expanding automated test coverage (`290964f`, `3bbceee`, `5b9b510`, `c12ca20`).


## [Implementing Feedback]

This section records major prototype changes that show iterative design in response to feedback.

### [Safeguarding Flag for Staff Risk] - 2026-03-04

#### Added

- Added a safeguarding flag so staff could mark cases where a resident may pose a risk to staff. (`eb95524`).

#### Feedback Incorporated

- This was implemented in response to council feedback from a meeting on 6 February 2026 about wanting to be able to mark safeguarding concerns for residents who may pose a risk to staff.

### [Form Structure and Routing] - 2026-03-05

#### Changed

- Enquiry selection was moved to the first step (`72cdfe5`).
- The enquiry list was changed to the council-provided service options (`72cdfe5`).
- Self-service options were removed from the form. (`72cdfe5`).

#### Feedback Incorporated

- Council feedback from a meeting on 24 February 2026 indicated that the form structure should be reworked and that self-service options were unlikely to be used and should be removed.

### [Staff-Controlled Prioritisation] - 2026-03-13

#### Added

- Manual queue reordering for staff (`47188d5`).
- Staff case-priority controls (`6e38244`).

#### Feedback Incorporated

- The council stated in a meeting on 24 February 2026 that they preferred manual prioritisation instead of automated triage, so prioritisation was limited to staff only.

### [Personal Details Change] - 2026-03-24

#### Changed

- First name and last name were made required fields in the personal-details step (`776bab0`).

#### Feedback Incorporated

- Feedback from user testing suggested that the personal details step should require first and last name from the user.

### [Ticket Created Information] - 2026-03-24

#### Added

- Displayed timestamps in staff queue items so staff could see when tickets entered the queue (`6eed50c`).

#### Feedback Incorporated

- Staff user testing feedback suggested that the staff dashboard should display the time tickets were created.
