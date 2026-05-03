/**
 * Portal Shows API — Server-side scoped query for performer portal.
 * Returns only shows where the given performer is on the roster,
 * with sensitive fields (other performers' pay, client financials) stripped.
 *
 * GET /api/portal-shows?performerId=P-0001
 *
 * Version: 1.0.0
 * Created: 2026-05-03
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from './lib/firebase-admin';

interface PortalShow {
  id: string;
  eventName: string;
  showDate: string;
  venueName: string;
  venueAddress: string;
  city: string;
  state: string;
  loadInTime: string;
  performanceStartTime: string;
  performanceEndTime: string;
  notesToTalent: string;
  pay: string;
  status: string;
  performerStatus: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', 'https://vrbrain.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const performerId = req.query.performerId as string;
  if (!performerId) {
    return res.status(400).json({ error: 'Missing performerId' });
  }

  try {
    const snap = await adminDb.collection('show_intelligence').get();
    const results: PortalShow[] = [];
    let performerName = '';

    for (const doc of snap.docs) {
      const s = doc.data();
      const roster = s.roster?.performers || [];
      const me = roster.find((p: any) =>
        p.performerId === performerId ||
        p.name?.toLowerCase().includes(performerId.toLowerCase())
      );
      if (!me) continue;
      if (!performerName && me.name) performerName = me.name;

      results.push({
        id: doc.id,
        eventName: s.eventName || s.clientName || 'Show',
        showDate: s.showDate || '',
        venueName: s.venueName || '',
        venueAddress: s.venueAddress || '',
        city: s.venueCity || '',
        state: s.venueState || '',
        loadInTime: s.loadInTime || '',
        performanceStartTime: s.performanceStartTime || '',
        performanceEndTime: s.performanceEndTime || '',
        notesToTalent: s.notesToTalent || '',
        pay: me.pay || '',
        status: s.status || 'inquiry',
        performerStatus: me.status || 'inquired',
      });
    }

    results.sort((a, b) => (a.showDate || '').localeCompare(b.showDate || ''));

    return res.status(200).json({ performerName, shows: results });
  } catch (error: any) {
    console.error('[portal-shows] Error:', error.message);
    return res.status(500).json({ error: 'Failed to load shows' });
  }
}
