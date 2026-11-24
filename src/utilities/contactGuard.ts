import { createHmac, timingSafeEqual } from 'node:crypto'

import type { Payload } from 'payload'

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

// ---------------------------------------------------------------------------------------------
// Switches managed in the admin (Site settings > Security). Every default is "protection on", and
// that is also what applies if the settings cannot be read.
// ---------------------------------------------------------------------------------------------

export type SecuritySettings = {
  contentScreening: 'drop' | 'off' | 'quarantine'
  honeypot: boolean
  maxPerAddressPerDay: number
  maxPerHour: number
  minFillSeconds: number
  paused: boolean
  rateLimit: boolean
  spamFilter: boolean
  turnstile: boolean
}

export const DEFAULT_SECURITY: SecuritySettings = {
  contentScreening: 'quarantine',
  honeypot: true,
  maxPerAddressPerDay: 3,
  maxPerHour: 20,
  minFillSeconds: 3,
  paused: false,
  rateLimit: true,
  spamFilter: true,
  turnstile: true,
}

export const getSecuritySettings = async (payload: Payload): Promise<SecuritySettings> => {
  try {
    const global = await payload.findGlobal({ slug: 'security', depth: 0, overrideAccess: true })
    const form = global.contactForm ?? {}
    const d = DEFAULT_SECURITY
    const number = (value: unknown, fallback: number): number =>
      typeof value === 'number' && Number.isFinite(value) ? value : fallback
    return {
      contentScreening:
        form.contentScreening === 'drop' ||
        form.contentScreening === 'off' ||
        form.contentScreening === 'quarantine'
          ? form.contentScreening
          : d.contentScreening,
      honeypot: form.honeypot ?? d.honeypot,
      maxPerAddressPerDay: number(form.maxPerAddressPerDay, d.maxPerAddressPerDay),
      maxPerHour: number(form.maxPerHour, d.maxPerHour),
      minFillSeconds: number(form.minFillSeconds, d.minFillSeconds),
      paused: form.paused ?? d.paused,
      rateLimit: form.rateLimit ?? d.rateLimit,
      spamFilter: form.spamFilter ?? d.spamFilter,
      turnstile: form.turnstile ?? d.turnstile,
    }
  } catch {
    // Table missing (migration not run yet) or database hiccup: fail safe, protections on
    return DEFAULT_SECURITY
  }
}

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

export const checkToken = (
  token: unknown,
  now: number = Date.now(),
  minAgeMs: number = MIN_AGE_MS,
): TokenResult => {
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
  if (age < minAgeMs) return 'too-fast'
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
  { ok: true; data: SubmissionEntry[]; hiddenCharacters: number } | { ok: false; message: string }

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
// Invisible characters that can hide instructions or text from a human reader but not from a
// program or an AI: zero-width space, word joiner and invisible operators, byte-order mark,
// bidirectional overrides, Unicode "tag" characters and supplementary variation selectors.
// Joiners used by emoji and by some scripts (U+200C, U+200D) and emoji selectors (U+FE0F) stay.
const HIDDEN_CHARS = new RegExp(
  '[\\u200B\\u2060-\\u2064\\uFEFF\\u202A-\\u202E\\u2066-\\u2069\\u{E0000}-\\u{E007F}\\u{E0100}-\\u{E01EF}]',
  'gu',
)
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
  let hiddenCharacters = 0

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
      const original = String(raw ?? '')
      hiddenCharacters += original.match(HIDDEN_CHARS)?.length ?? 0
      value = original
        .replace(HIDDEN_CHARS, '')
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
  return { hiddenCharacters, ok: true, data }
}

// ---------------------------------------------------------------------------------------------
// Spam heuristics. Each signal adds to a score; two signals is spam. Spam gets a fake success so
// a bot learns nothing, and nothing is stored.
// ---------------------------------------------------------------------------------------------

const LINK_PATTERN =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|ru|cn|xyz|top|info|biz|site|online|shop|click)\b\/)/gi

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

// ---------------------------------------------------------------------------------------------
// Content screening: text that is code, or is written to instruct a program or an AI that reads
// the message later. Submissions are only ever stored and shown as plain text, so this is a second
// line of defense, mainly so nobody (or no tool) is handed hostile text by accident.
// ---------------------------------------------------------------------------------------------

const SCREEN_PATTERNS: [string, RegExp][] = [
  // Markup and script
  ['html', /<\s*\/?\s*[a-z!][^>]*>/i],
  [
    'script',
    /(javascript|vbscript)\s*:|data\s*:\s*text\/html|\bon(?:error|load|click|mouseover|focus)\s*=/i,
  ],
  // Template and expression markers
  ['template', /\{\{|\}\}|\$\{|<%|%>|\{%/],
  // Chat-template control tokens and role headers
  ['chat-tokens', /<\|?\s*(?:im_start|im_end|endoftext|system|assistant)\s*\|?>|\[\/?INST\]/i],
  ['role-header', /^\s*(?:system|assistant|developer)\s*:/im],
  // Attempts to instruct an AI
  [
    'ai-instructions',
    /\b(?:ignore|disregard|forget|override)\s+(?:all\s+|any\s+|the\s+|your\s+|my\s+)?(?:previous|prior|above|earlier|preceding|system|safety)\s+(?:instructions?|prompts?|messages?|rules|guidelines)|\b(?:new|updated|real)\s+instructions?\s*:|\b(?:reveal|print|show|repeat|output)\s+(?:your|the)\s+(?:system\s+prompt|hidden|secret|instructions)|\bdo\s+not\s+(?:tell|inform|mention|alert)\s+the\s+(?:user|human|owner)|\bwhen\s+(?:you|an?\s+(?:ai|assistant|llm|model|agent))\s+(?:read|see|process|summari[sz]e|review|inspect)s?\s+this\b|\byou\s+are\s+now\s+(?:an?\s+)?(?:ai|assistant|admin|developer|jailbroken)/i,
  ],
]

export const screenContent = (data: SubmissionEntry[], hiddenCharacters: number): string[] => {
  const reasons = new Set<string>()
  if (hiddenCharacters > 0) reasons.add('hidden-characters')
  for (const { value } of data) {
    for (const [reason, pattern] of SCREEN_PATTERNS) {
      if (pattern.test(value)) reasons.add(reason)
    }
  }
  return [...reasons]
}

// Marker stored with a quarantined submission; the email guard skips notifications for it.
export const SECURITY_FLAG_FIELD = 'security-flag'
