import { useId } from "react";
import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { outlinedInfoAlertSx } from "./outlinedInfoAlertSx";

type PrivacyNoticeDialogProps = {
  open: boolean;
  onClose: () => void;
};

function BulletList({ items }: { items: string[] }) {
  return (
    <Box component="ul" sx={{ m: 0, pl: 3, display: "grid", gap: 0.75 }}>
      {items.map((item) => (
        <Box component="li" key={item}>
          <Typography variant="body2">{item}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function Section(props: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
        {props.title}
      </Typography>
      {props.children}
    </Box>
  );
}

export default function PrivacyNoticeDialog(props: PrivacyNoticeDialogProps) {
  const { open, onClose } = props;
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <DialogTitle
        id={titleId}
        sx={(theme) => ({
          fontWeight: 800,
          color: "common.white",
          bgcolor: theme.palette.primary.dark,
          borderBottom: "1px solid",
          borderColor: alpha(theme.palette.common.white, 0.16),
        })}
      >
        Privacy Notice
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Alert
            severity="info"
            variant="outlined"
            sx={outlinedInfoAlertSx}
          >
            Last updated: 16 March 2026
          </Alert>

          <Typography variant="body2">
            The London Borough of Hounslow is committed to protecting and respecting your privacy
            and meeting its obligation under data protection law and other relevant legislation.
          </Typography>

          <Typography variant="body2" id={descriptionId}>
            This privacy notice applies to ResidentsPath and tells you what to expect us to do with
            your personal information when you use ResidentsPath to submit an enquiry. It should be
            read alongside the Council&apos;s{" "}
            <Link
              href="https://www.hounslow.gov.uk/privacy-notice"
              target="_blank"
              rel="noreferrer"
            >
              Privacy notice
            </Link>
            .
          </Typography>

          <Typography variant="body2">
            This privacy notice is regularly reviewed however, you are advised to check this page
            from time to time for any updates to this notice.
          </Typography>

          <Section title="Data controller">
            <Typography variant="body2">
              The London Borough of Hounslow is the data controller for the personal information
              collected through ResidentsPath.
            </Typography>
          </Section>

          <Section title="What information we collect and hold">
            <BulletList
              items={[
                "Information about your enquiry, urgency, support needs, and any other details you choose to provide so we can understand your request.",
                "Personal details you choose to provide, such as your name, preferred name, pronouns, date of birth, email address, phone number, and address.",
                "Household, accessibility, safeguarding, or vulnerability information relevant to the service requested, such as children in the household, disability or sensory needs, safe contact details, and domestic abuse related information.",
                "Queue or appointment information, including the next step you choose, appointment slot details, and the case, booking, or queue reference numbers created for your request.",
              ]}
            />
          </Section>

          <Section title="How do we get your information?">
            <BulletList
              items={[
                "Most of the personal information we process through ResidentsPath is provided directly by you when you complete the form.",
                "If you are signed in to ResidentsPath, some information may also come from your existing account details. Information you provide may update your profile so future enquiries can be managed more accurately.",
                "If you use Save and continue later, a draft of your answers may be stored in this browser on this device until you return to the form, start a new form, or clear your browser storage.",
              ]}
            />
          </Section>

          <Section title="Why we need your information (purposes of processing)">
            <BulletList
              items={[
                "To receive, record, and manage your enquiry.",
                "To direct your request to the right council service or team.",
                "To understand any accessibility, support, urgency, or safeguarding needs linked to your request.",
                "To create and manage a queue ticket or appointment where this forms part of the service you need.",
                "To contact you about your request if you choose to provide contact details and ask for updates.",
                "To keep records, investigate complaints, protect public funds, prevent fraud, and improve how council services are delivered.",
              ]}
            />
          </Section>

          <Section title="Do you have to provide this information?">
            <Typography variant="body2" sx={{ mb: 2 }}>
              Most of the information we collect through ResidentsPath is optional. However, you
              must tell us the type of enquiry you are making and how you want to proceed. If you
              choose not to provide other information, this may limit how far we can help with your
              request, assess any support needs, or contact you with updates.
            </Typography>
            <Typography variant="body2">
              If you do not wish for us to share information, you should let us know. However, there
              are times when your information could still be shared, for example where this is
              required by law or where it is necessary to protect a child, a vulnerable adult,
              yourself, or the public.
            </Typography>
          </Section>

          <Section title="Our lawful basis for processing your information">
            <Typography variant="body2" sx={{ mb: 2 }}>
              The lawful basis we rely on for processing the personal information in this form is
              Article 6(1)(e) of the UK GDPR. This allows us to process information where this is
              necessary for the performance of a task carried out in the public interest or in the
              exercise of official authority vested in the Council. In ResidentsPath, this includes
              receiving enquiries, directing requests to the right service, and helping the Council
              carry out its public and statutory functions.
            </Typography>
            <Typography variant="body2">
              If you provide health, disability, accessibility, or other special category
              information that is needed to support your request, the Council will only process that
              information where an additional condition under Article 9 of the UK GDPR and Schedule
              1 of the Data Protection Act 2018 also applies to the relevant service and purpose.
            </Typography>
          </Section>

          <Section title="Who your information may be shared with (internally and externally)">
            <BulletList
              items={[
                "Authorised council staff and the service team responsible for dealing with your request.",
                "Approved suppliers and processors acting on the Council's instructions to host the service and deliver operational messages, such as cloud hosting providers and email or text message delivery providers.",
                "Other council teams or partner organisations where this is necessary to provide the support or service you have asked for.",
                "Organisations we are required to share information with by law, or where sharing is necessary to prevent fraud, protect public funds, or protect someone from serious harm.",
              ]}
            />
            <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
              We work with a range of partner organisations to help deliver our services to you.
              Where we have these arrangements there is always an agreement in place to make sure
              that the organisation complies with data protection law.
            </Typography>
            <Typography variant="body2">
              We do not sell your personal data and we do not use the information entered in this
              form for marketing.
            </Typography>
          </Section>

          <Section title="How long we keep your information">
            <Typography variant="body2" sx={{ mb: 2 }}>
              We often keep your personal data for audit purposes, legal reasons and best practice
              records management guidelines. There are set periods of time for keeping information
              which we incorporate where applicable as part of our records management policy and
              retention schedules.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              For ResidentsPath, the length of time we keep information may vary depending on the
              type of enquiry, the service involved, and whether the record is needed for
              safeguarding, complaints, audit, or legal obligations. This may range from months for
              some records to much longer periods for more sensitive records.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We will then dispose of your information in the most secure manner possible.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Any draft saved in your browser is stored locally on the device you are using and is
              not a substitute for the Council&apos;s submitted service record.
            </Typography>
            <Typography variant="body2">
              Do not use Save and continue later on a public or shared device unless you are happy
              for someone else using that device to be able to access your draft.
            </Typography>
          </Section>

          <Section title="Transfers to third countries">
            <Typography variant="body2">
              All the information you provide us is held within the UK and European Economic Area.
            </Typography>
          </Section>

          <Section title="Cookies and local browser storage">
            <Typography variant="body2" sx={{ mb: 2 }}>
              ResidentsPath does not use this form for advertising or marketing cookies.
            </Typography>
            <Typography variant="body2">
              If you use Save and continue later, a draft may be stored locally in your browser on
              this device. For broader information about the Council&apos;s website privacy and
              cookies, please see the{" "}
              <Link
                href="https://www.hounslow.gov.uk/privacy-notice"
                target="_blank"
                rel="noreferrer"
              >
                Privacy notice
              </Link>
              .
            </Typography>
          </Section>

          <Section title="Your data protection rights">
            <Typography variant="body2" sx={{ mb: 2 }}>
              The rights available to you depend on our reason for processing your information. You
              may have the right to ask for access to your personal data, ask us to correct
              inaccurate information, ask us to restrict processing, object to processing, and in
              some circumstances ask us to erase information. These rights are not absolute.
            </Typography>
            <Typography variant="body2">
              For further information about your data protection rights and how to make a request,
              please see the Council&apos;s{" "}
              <Link
                href="https://www.hounslow.gov.uk/open-data-information-requests/data-protection/2"
                target="_blank"
                rel="noreferrer"
              >
                data protection rights page
              </Link>
              .
            </Typography>
          </Section>

          <Section title="Your right to object">
            <Typography variant="body2">
              In some circumstances, you have the right to object to our processing of your personal
              data. This right is not absolute and depends on the reason we are processing your
              information.
            </Typography>
          </Section>

          <Section title="How do we protect and keep your information secure?">
            <Typography variant="body2" sx={{ mb: 2 }}>
              We take the protection of your personal data seriously whether it is electronic or
              paper records.
            </Typography>
            <BulletList
              items={[
                "Encryption, meaning that information is hidden so that it cannot be read without special knowledge such as a password.",
                "Verification processes in place to seek to validate and verify information.",
                "Controlling access to systems and networks so that people who are not allowed to view your personal information cannot get access to it.",
                "Training for our staff so they know how to handle information and how and when to report when something goes wrong.",
              ]}
            />
          </Section>

          <Section title="Contact us">
            <Typography variant="body2" sx={{ mb: 2 }}>
              If you have questions about ResidentsPath or how your information is used, contact the
              London Borough of Hounslow by email at{" "}
              <Link href="mailto:customerservice@hounslow.gov.uk">
                customerservice@hounslow.gov.uk
              </Link>{" "}
              or by phone on <Link href="tel:02085832000">020 8583 2000</Link>.
            </Typography>
            <Typography variant="body2">
              You can also write to: London Borough of Hounslow, Hounslow House, 7 Bath Road,
              Hounslow, Middlesex, TW3 3EB.
            </Typography>
          </Section>

          <Section title="Data Protection Officer">
            <Typography variant="body2" sx={{ mb: 2 }}>
              The Council&apos;s Data Protection Officer can be contacted on{" "}
              <Link href="mailto:InformationGovernance@hounslow.gov.uk">
                InformationGovernance@hounslow.gov.uk
              </Link>
              .
            </Typography>
            <Typography variant="body2">
              Information Governance Team, London Borough of Hounslow, Hounslow House, 7 Bath Road,
              TW3 3EB.
            </Typography>
          </Section>

          <Section title="Your right to make a complaint">
            <Typography variant="body2" sx={{ mb: 2 }}>
              The Council tries to meet the highest standards when collecting and using personal
              information. For this reason, we take any complaints we receive about this very
              seriously.
            </Typography>
            <Typography variant="body2">
              If you have any concerns or complaints about the way your personal information has
              been used, please contact the Council first so we can try to resolve the issue.
            </Typography>
          </Section>

          <Section title="Information Commissioner's Office">
            <Typography variant="body2" sx={{ mb: 2 }}>
              The Information Commissioner is the UK&apos;s independent body set up to uphold
              information rights.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              If you are unhappy with how your personal data has been handled, you can complain to
              the Information Commissioner&apos;s Office at{" "}
              <Link href="https://ico.org.uk/" target="_blank" rel="noreferrer">
                ico.org.uk
              </Link>{" "}
              or by email at{" "}
              <Link href="mailto:icocasework@ico.org.uk">icocasework@ico.org.uk</Link>.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Information Commissioner&apos;s Office, Wycliffe House, Water Lane, Wilmslow,
              Cheshire, SK9 5AF.
            </Typography>
            <Typography variant="body2">
              ICO registration number for the London Borough of Hounslow: Z5761176.
            </Typography>
          </Section>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
