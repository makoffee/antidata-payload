import { issueToken } from '@/utilities/contactGuard'

// Handed out when the contact form loads. The form must send it back with the submission,
// which proves the page was really loaded and how long the visitor took to fill it in.
export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  return Response.json({ token: issueToken() }, { headers: { 'Cache-Control': 'no-store' } })
}
