import configPromise from '@payload-config'
import { getPayload } from 'payload'

// Contact form messages are kept for 12 months, then deleted (stated on the Data Protection page).
// Vercel Cron calls this daily with `Authorization: Bearer $CRON_SECRET` (see vercel.json).
const RETENTION_MONTHS = 12

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS)

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.delete({
    collection: 'form-submissions',
    where: { createdAt: { less_than: cutoff.toISOString() } },
  })

  return Response.json({ deleted: docs.length, olderThan: cutoff.toISOString() })
}
