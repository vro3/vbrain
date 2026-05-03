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
import { adminAuth } from './_lib/firebase-admin';

const ALLOWED_ORIGINS = [
  'https://vrbrain.vercel.app',
  'http://localhost:3000',
];

const ALLOWED_EMAILS = [
  'vince@vinceromanelli.com',
  'vr@vrcreativegroup.com',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify Firebase auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!ALLOWED_EMAILS.includes(decoded.email || '')) {
      return res.status(403).json({ error: 'Not authorized' });
    }
  } catch {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }

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
