import { createHmac, timingSafeEqual } from 'node:crypto'

import type { Form } from '@/payload-types'

// Server-side checks for the contact form. Used by /next/contact (the only way to create a
// form submission; the public REST create endpoint is closed in src/plugins/index.ts).

export const HONEYPOT_FIELD = 'website'
export const MAX_BODY_BYTES = 20_000

// Proof of consent, stored with every submission. Bump the version when the checkbox wording
// in src/blocks/Form/Component.tsx changes.
export const CONSENT_VERSION = 'v2'
export const consentEntry = (now: Date = new Date()): { field: string; value: string } => ({
  field: 'gdpr-consent',
  value: `Agreed ${now.toISOString()} (wording ${CONSENT_VERSION}: store name and email to reply and for contact about new projects and services)`,
})

const MIN_AGE_MS = 3_000 // a human cannot fill in the form faster than this
const MAX_AGE_MS = 60 * 60 * 1000 // a form left open longer than an hour must be reloaded

const MAX_LENGTH = { email: 254, text: 200, textarea: 5_000, other: 200 } as const

// ---------------------------------------------------------------------------------------------
// Signed page-load token: "<timestamp>.<hmac>". Proves the page was loaded (JS ran) and how long ago.
// ---------------------------------------------------------------------------------------------

const sign = (timestamp: string): string =>
  createHmac('sha256', `contact-form:${process.env.PAYLOAD_SECRET ?? ''}`)
    .update(timestamp)
    .digest('hex')

export const issueToken = (now: number = Date.now()): string => {
  const timestamp = String(now)
  return `${timestamp}.${sign(timestamp)}`
}

export type TokenResult = 'ok' | 'invalid' | 'expired' | 'too-fast'

export const checkToken = (token: unknown, now: number = Date.now()): TokenResult => {
  if (typeof token !== 'string') return 'invalid'
  const [timestamp, signature, ...rest] = token.split('.')
  if (!timestamp || !signature || rest.length > 0 || !/^\d{10,15}$/.test(timestamp)) {
    return 'invalid'
  }

  const expected = Buffer.from(sign(timestamp))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return 'invalid'

  const age = now - Number(timestamp)
  if (age < 0) return 'invalid'
  if (age < MIN_AGE_MS) return 'too-fast'
  if (age > MAX_AGE_MS) return 'expired'
  return 'ok'
}

// ---------------------------------------------------------------------------------------------
// Cloudflare Turnstile. Enforced whenever TURNSTILE_SECRET_KEY is set (Vercel); skipped when
// it is not (a fresh local checkout).
// ---------------------------------------------------------------------------------------------

export const turnstileEnabled = (): boolean => Boolean(process.env.TURNSTILE_SECRET_KEY)

export const verifyTurnstile = async (token: unknown): Promise<boolean> => {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: new URLSearchParams({ response: token, secret }),
      method: 'POST',
      signal: AbortSignal.timeout(5_000),
    })
    const json = (await res.json()) as { success?: boolean }
    return json.success === true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------------------------
// Field validation against the form's own definition
// ---------------------------------------------------------------------------------------------

type FormField = NonNullable<Form['fields']>[number]
export type SubmissionEntry = { field: string; value: string }
export type ValidationResult =
  { ok: true; data: SubmissionEntry[] } | { ok: false; message: string }

// Control characters (incl. CR/LF for single-line fields) never belong in a contact message.
// Built from code points so the source file holds no raw control characters.
const controlChars = (keepNewlines: boolean): RegExp => {
  const ranges = keepNewlines
    ? '\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F\\u2028\\u2029'
    : '\\u0000-\\u001F\\u007F-\\u009F\\u2028\\u2029'
  return new RegExp(`[${ranges}]`, 'g')
}
const CONTROL_ALL = controlChars(false)
const CONTROL_KEEP_NEWLINES = controlChars(true)
const EMAIL_PATTERN = /^[^\s@<>(),;:"[\]\\]+@[^\s@<>(),;:"[\]\\]+\.[^\s@<>(),;:"[\]\\]{2,}$/

export const isValidEmail = (value: string): boolean =>
  value.length <= MAX_LENGTH.email && EMAIL_PATTERN.test(value)

export const validateSubmission = (form: Form, input: unknown): ValidationResult => {
  if (!Array.isArray(input) || input.length > 50) {
    return { ok: false, message: 'Please check the form and try again.' }
  }

  // Only the first value per field name counts; unknown names are ignored, not stored.
  const submitted = new Map<string, unknown>()
  for (const item of input) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as { field?: unknown }).field === 'string' &&
      !submitted.has((item as { field: string }).field)
    ) {
      submitted.set((item as { field: string }).field, (item as { value?: unknown }).value)
    }
  }

  const data: SubmissionEntry[] = []

  for (const field of form.fields ?? []) {
    if (field.blockType === 'message') continue
    const raw = submitted.get(field.name)
    let value: string

    if (field.blockType === 'checkbox') {
      value = raw === true || raw === 'true' ? 'true' : 'false'
    } else if (field.blockType === 'number') {
      const num = typeof raw === 'number' ? raw : Number(String(raw ?? '').trim())
      value = String(raw ?? '').trim() === '' ? '' : String(num)
      if (value !== '' && !Number.isFinite(num)) {
        return { ok: false, message: `${field.label || field.name} must be a number.` }
      }
    } else {
      if (raw !== undefined && raw !== null && typeof raw !== 'string') {
        return { ok: false, message: 'Please check the form and try again.' }
      }
      const multiline = field.blockType === 'textarea'
      value = String(raw ?? '')
        .normalize('NFC')
        .replace(multiline ? CONTROL_KEEP_NEWLINES : CONTROL_ALL, '')
        .trim()

      if (field.blockType === 'email') value = value.toLowerCase()

      const max =
        field.blockType === 'email'
          ? MAX_LENGTH.email
          : field.blockType === 'textarea'
            ? MAX_LENGTH.textarea
            : field.blockType === 'text'
              ? MAX_LENGTH.text
              : MAX_LENGTH.other
      if (value.length > max) {
        return { ok: false, message: `${field.label || field.name} is too long.` }
      }
      if (field.blockType === 'email' && value !== '' && !isValidEmail(value)) {
        return { ok: false, message: 'Please enter a valid email address.' }
      }
      if (
        field.blockType === 'select' &&
        value !== '' &&
        field.options &&
        !field.options.some((option) => option.value === value)
      ) {
        return { ok: false, message: 'Please check the form and try again.' }
      }
    }

    if (field.required && (value === '' || (field.blockType === 'checkbox' && value !== 'true'))) {
      return { ok: false, message: `${field.label || field.name} is required.` }
    }
    // The submissions collection requires a non-empty value
    if (value === '') continue

    data.push({ field: field.name, value })
  }

  if (data.length === 0) return { ok: false, message: 'Please fill in the form.' }
  return { ok: true, data }
}

// ---------------------------------------------------------------------------------------------
// Spam heuristics. Each signal adds to a score; two signals is spam. Spam gets a fake success so
// a bot learns nothing, and nothing is stored.
// ---------------------------------------------------------------------------------------------

const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|ru|cn|xyz|top|info|biz|site|online|shop|click)\b\/)/gi

// Random strings like "BgyOFNBdNpwjzFMYWg": one long word with many lower→upper jumps
const looksRandom = (value: string): boolean => {
  if (value.length < 10 || /\s/.test(value)) return false
  const jumps = value.match(/[a-z][A-Z]/g)?.length ?? 0
  return jumps >= 3
}

export const spamSignals = (data: SubmissionEntry[]): string[] => {
  const signals: string[] = []
  const values = data.map((entry) => entry.value)

  const links = values.reduce((sum, value) => sum + (value.match(LINK_PATTERN)?.length ?? 0), 0)
  if (links > 2) signals.push('links')

  const randomFields = data.filter(
    (entry) => entry.field !== 'email' && looksRandom(entry.value),
  ).length
  if (randomFields >= 1) signals.push('random-text')
  if (randomFields >= 2) signals.push('random-text-twice')

  const email = data.find((entry) => entry.field === 'email')?.value
  if (email) {
    const [local = '', domain = ''] = email.split('@')
    const dots = local.split('.').length - 1
    if (/^(gmail|googlemail)\.com$/.test(domain) && dots >= 4) signals.push('gmail-dots')
  }

  // A real message has spaces
  const message = data.find((entry) => entry.field === 'message')?.value
  if (message && message.length >= 12 && !/\s/.test(message)) signals.push('one-word-message')

  return signals
}

export const isSpam = (data: SubmissionEntry[]): { spam: boolean; signals: string[] } => {
  const signals = spamSignals(data)
  return { signals, spam: signals.length >= 2 }
}
