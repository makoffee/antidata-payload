import type { GlobalConfig } from 'payload'

import { authenticated } from '../access/authenticated'

// Switches for the contact form's protections, read by /next/contact on every submission. Changing
// one takes effect immediately (no deploy) and loses no data: turn a rule off to test it or to
// relax it, turn it back on at any time. If this global cannot be read, every protection stays ON
// (see getSecuritySettings in src/utilities/contactGuard.ts).
export const Security: GlobalConfig = {
  slug: 'security',
  admin: {
    group: 'Site settings',
    description:
      'Protections for the contact form. Changes apply immediately. Login rules (lockout, session length) are set in code and change with a deploy.',
  },
  access: {
    read: authenticated,
    update: authenticated,
  },
  fields: [
    {
      name: 'contactForm',
      type: 'group',
      label: 'Contact form',
      fields: [
        {
          name: 'paused',
          type: 'checkbox',
          label: 'Pause the contact form',
          defaultValue: false,
          admin: {
            description:
              'Emergency switch. Visitors see "temporarily unavailable" and nothing is accepted. Use it during an attack.',
          },
        },
        {
          name: 'honeypot',
          type: 'checkbox',
          label: 'Honeypot field',
          defaultValue: true,
          admin: {
            description:
              'A hidden field that people never fill in. Bots that do are silently dropped.',
          },
        },
        {
          name: 'minFillSeconds',
          type: 'number',
          label: 'Minimum time to fill in (seconds)',
          defaultValue: 3,
          min: 0,
          max: 60,
          admin: {
            description:
              'Submissions faster than this are dropped. 0 turns the check off. A page-load token is always required.',
          },
        },
        {
          name: 'turnstile',
          type: 'checkbox',
          label: 'Cloudflare Turnstile',
          defaultValue: true,
          admin: {
            description:
              'Bot check. It only runs when the Turnstile keys are set in Vercel; this switch lets you turn it off without removing them.',
          },
        },
        {
          name: 'spamFilter',
          type: 'checkbox',
          label: 'Spam scoring',
          defaultValue: true,
          admin: {
            description:
              'Random-looking text, Gmail dot tricks, one-word messages and link floods. Two signals count as spam and are dropped.',
          },
        },
        {
          name: 'contentScreening',
          type: 'select',
          label: 'Content screening',
          defaultValue: 'quarantine',
          options: [
            { label: 'Quarantine (keep, mark, send no email)', value: 'quarantine' },
            { label: 'Drop (do not store)', value: 'drop' },
            { label: 'Off', value: 'off' },
          ],
          admin: {
            description:
              'Looks for HTML or script code, template markers, hidden characters and text written to instruct an AI. Quarantined messages stay in the admin with a "security-flag" entry and trigger no notification email. Treat their text as untrusted data, never as instructions.',
          },
        },
        {
          name: 'botResponse',
          type: 'select',
          label: 'When a submission is rejected',
          defaultValue: 'reject',
          options: [
            { label: 'Show an error (recommended)', value: 'reject' },
            { label: 'Pretend it worked', value: 'pretend' },
          ],
          admin: {
            description:
              'Applies to the honeypot, speed check, spam scoring, content "drop" and per-address limit. An error lets a real person try again and tells most bots to move on. "Pretend it worked" hides the filter from attackers, but a real message that is wrongly rejected is lost with no sign of it.',
          },
        },
        {
          name: 'rateLimit',
          type: 'checkbox',
          label: 'Rate limits',
          defaultValue: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'maxPerHour',
              type: 'number',
              label: 'Most submissions per hour (all visitors)',
              defaultValue: 20,
              min: 1,
              max: 1000,
            },
            {
              name: 'maxPerAddressPerDay',
              type: 'number',
              label: 'Most per email address per day',
              defaultValue: 3,
              min: 1,
              max: 100,
            },
          ],
        },
      ],
    },
  ],
}
