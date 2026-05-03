/**
 * Portal Respond API — Verified performer response handler.
 * Validates HMAC token before writing to brain_requests.
 * Falls back to allowing tokenless requests temporarily for backward compatibility
 * with existing email links (will be removed once all old links expire).
 *
 * POST /api/portal-respond
 * Body: { performerId, showId, type, response, token? }
 *
 * Version: 1.0.0
 * Created: 2026-05-03
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { adminDb } from './lib/firebase-admin';

function verifyToken(performerId: string, showId: string, type: string, token: string): boolean {
  const secret = process.env.PORTAL_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret)
    .update(`${performerId}:${showId}:${type}`)
    .digest('hex');
  return token === expected;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vrbrain.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { performerId, showId, type, response, token } = req.body;

  if (!performerId || !showId || !type || !response) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate response value
  if (response !== 'yes' && response !== 'no') {
    return res.status(400).json({ error: 'Response must be yes or no' });
  }

  // Token verification
  const portalSecret = process.env.PORTAL_SECRET;
  if (portalSecret) {
    // If PORTAL_SECRET is configured, require valid token
    if (!token || !verifyToken(performerId, showId, type, token)) {
      return res.status(403).json({
        error: 'Invalid or expired link. Please contact VR Creative Group for a new link.',
      });
    }
  }
  // If PORTAL_SECRET not yet configured, allow through (backward compat)
  // Remove this fallback once PORTAL_SECRET is set on both vrbrain and vcommand

  // Verify this performer actually exists on this show
  try {
    const showDoc = await adminDb.collection('show_intelligence').doc(showId).get();
    if (!showDoc.exists) {
      return res.status(404).json({ error: 'Show not found' });
    }
    const showData = showDoc.data();
    const roster = showData?.roster?.performers || [];
    const performer = roster.find((p: any) =>
      p.performerId === performerId || p.name?.toLowerCase().includes(performerId.toLowerCase())
    );
    if (!performer) {
      return res.status(404).json({ error: 'Performer not found on this show' });
    }

    // Write to brain_requests via Admin SDK
    const brainRef = adminDb.collection('brain_requests').doc();
    await brainRef.set({
      id: brainRef.id,
      type: 'action',
      source: 'portal',
      prompt: `Record performer response: ${performerId} responded ${response} to ${type} for show ${showId}`,
      showId,
      context: {
        actionSteps: [{
          tool: 'update_roster',
          params: { showId, performerId, response, emailType: type },
        }],
      },
      status: 'pending',
      createdAt: new Date().toISOString(),
      ttl: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const responseText = response === 'yes' ? 'accepted' : 'declined';
    return res.status(200).json({ message: `Response recorded: ${responseText} the ${type}.` });
  } catch (error: any) {
    console.error('[portal-respond] Error:', error.message);
    return res.status(500).json({ error: 'Failed to record response' });
  }
}
