import type { BeforeEmail } from '@payloadcms/plugin-form-builder/types'

import { isValidEmail, SECURITY_FLAG_FIELD } from '@/utilities/contactGuard'

// Runs before the plugin sends a notification for a form submission.
// - A recipient (to/cc/bcc) that comes from submitted data ({{email}}) would let a visitor make the
//   site send mail to anyone, so such emails are dropped. Notifications go only to fixed addresses.
// - Reply-To is kept only if it is a plain, valid address (else it falls back to the sender); subject and sender lose line breaks.
const oneLine = (value: string): string => value.replace(/[\r\n]+/g, ' ').trim()

export const guardContactEmails: BeforeEmail = async (emails, { data, req }) => {
  // A quarantined submission stays in the admin for review but triggers no email
  const submitted = Array.isArray(data?.submissionData) ? data.submissionData : []
  if (submitted.some((entry: { field?: string }) => entry?.field === SECURITY_FLAG_FIELD)) {
    req.payload.logger.info('contact form: email skipped (quarantined submission)')
    return []
  }

  const form = await req.payload.findByID({
    id: data.form,
    collection: 'forms',
    depth: 0,
    req,
  })
  const configured = form.emails ?? []

  return emails
    .filter((_, index) => {
      const config = configured[index]
      const dynamicRecipient = [config?.emailTo, config?.cc, config?.bcc].some((value) =>
        value?.includes('{{'),
      )
      if (dynamicRecipient) {
        req.payload.logger.warn('contact form: email skipped (recipient taken from submitted data)')
      }
      return !dynamicRecipient
    })
    .map((email) => {
      const replyTo = typeof email.replyTo === 'string' ? oneLine(email.replyTo) : ''
      return {
        ...email,
        from: oneLine(email.from),
        replyTo: isValidEmail(replyTo) ? replyTo : oneLine(email.from),
        subject: oneLine(email.subject),
        to: oneLine(email.to),
      }
    })
}
