/**
 * Send Email API — Direct proxy to vcommand's send-email endpoint.
 * Bypasses the brain_requests queue entirely.
 *
 * POST /api/send-email
 * Body: { showId, performerId, emailType, customBody? }
 *
 * Version: 1.0.0
 * Created: 2026-04-13
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for vrbrain client
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const vcommandUrl = process.env.VCOMMAND_URL || 'https://vcommand.vercel.app';
  const authToken = process.env.VCOMMAND_AUTH_TOKEN;

  if (!authToken) {
    return res.status(500).json({ error: 'VCOMMAND_AUTH_TOKEN not configured' });
  }

  const { showId, performerId, emailType, customBody } = req.body;

  if (!showId || !performerId || !emailType) {
    return res.status(400).json({ error: 'Missing required fields: showId, performerId, emailType' });
  }

  try {
    const response = await fetch(`${vcommandUrl}/api/showsync/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Service ${authToken}`,
      },
      body: JSON.stringify({ showId, performerId, emailType, customBody }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[vrbrain send-email] vcommand returned error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[vrbrain send-email] Proxy error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message,
    });
  }
}
