import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  checkToken,
  consentEntry,
  HONEYPOT_FIELD,
  isSpam,
  MAX_BODY_BYTES,
  validateSubmission,
  verifyTurnstile,
} from '@/utilities/contactGuard'

// The only way to create a contact form submission. The public REST endpoint
// (POST /api/form-submissions) is closed in src/plugins/index.ts.
export const dynamic = 'force-dynamic'

// Ceilings so a flood cannot fill the table or the email quota, whoever sends it.
const MAX_PER_HOUR = 20
const MAX_PER_ADDRESS_PER_DAY = 3

const fail = (message: string, status = 400, code?: string): Response =>
  Response.json({ code, message, ok: false }, { status })

// A bot gets the same answer as a visitor, so it learns nothing about what was rejected.
const fakeSuccess = (): Response => Response.json({ ok: true })

export async function POST(request: Request): Promise<Response> {
  // Only the site's own pages may post (browsers always send Origin on a fetch POST).
  const origin = request.headers.get('origin')
  let originHost: string | undefined
  try {
    originHost = origin ? new URL(origin).host : undefined
  } catch {
    originHost = undefined
  }
  if (!originHost || originHost !== request.headers.get('host')) {
    return fail('Forbidden.', 403)
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return fail('That message is too long.', 413)

  let body: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    body = parsed as Record<string, unknown>
  } catch {
    return fail('Please check the form and try again.')
  }

  const logger = (await getPayload({ config: configPromise })).logger

  // Honeypot: a hidden field that people never fill in.
  if (typeof body[HONEYPOT_FIELD] === 'string' && body[HONEYPOT_FIELD] !== '') {
    logger.info('contact form: dropped (honeypot)')
    return fakeSuccess()
  }

  const tokenResult = checkToken(body.token)
  if (tokenResult === 'too-fast') {
    logger.info('contact form: dropped (too fast)')
    return fakeSuccess()
  }
  if (tokenResult !== 'ok') {
    return fail('The form expired. Please reload the page and try again.', 400, 'token')
  }

  if (!(await verifyTurnstile(body.turnstileToken))) {
    return fail('The spam check failed. Please try again.', 400, 'turnstile')
  }

  if (typeof body.form !== 'string' && typeof body.form !== 'number') {
    return fail('Please check the form and try again.')
  }

  const payload = await getPayload({ config: configPromise })

  let form
  try {
    form = await payload.findByID({ id: body.form, collection: 'forms', depth: 0 })
  } catch {
    return fail('Please check the form and try again.')
  }

  // GDPR: no consent, no processing (the form also enforces this in the browser)
  if (body.consent !== true) {
    return fail('Please tick the box to agree before sending your message.', 400, 'consent')
  }

  const validation = validateSubmission(form, body.submissionData)
  if (!validation.ok) return fail(validation.message)

  const { signals, spam } = isSpam(validation.data)
  if (spam) {
    logger.info(`contact form: dropped (spam: ${signals.join(', ')})`)
    return fakeSuccess()
  }

  // Rate limits, counted from the submissions table (no IP addresses stored).
  const now = Date.now()
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()

  const { totalDocs: lastHour } = await payload.count({
    collection: 'form-submissions',
    where: { createdAt: { greater_than: hourAgo } },
  })
  if (lastHour >= MAX_PER_HOUR) {
    logger.warn('contact form: hourly limit reached')
    return fail('Too many messages right now. Please try again later.', 429)
  }

  const email = validation.data.find((entry) => entry.field === 'email')?.value
  if (email) {
    const { totalDocs: fromAddress } = await payload.count({
      collection: 'form-submissions',
      where: {
        and: [
          { createdAt: { greater_than: dayAgo } },
          { 'submissionData.value': { equals: email } },
        ],
      },
    })
    if (fromAddress >= MAX_PER_ADDRESS_PER_DAY) {
      logger.info('contact form: dropped (address limit)')
      return fakeSuccess()
    }
  }

  try {
    // Local API bypasses access control by default; the REST create is closed, so this route is
    // the gate. A fresh context per call, as the project rules require.
    await payload.create({
      collection: 'form-submissions',
      context: {},
      data: { form: form.id, submissionData: [...validation.data, consentEntry()] },
      overrideAccess: true,
    })
  } catch (err) {
    logger.error({ err, msg: 'contact form: could not save submission' })
    return fail('Something went wrong. Please try again later.', 500)
  }

  return Response.json({ ok: true })
}
