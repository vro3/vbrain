/**
 * One-time script: seed roster tracking data from Sheets into Firestore.
 * Run via: npx tsx src/scripts/seed-roster.ts
 * Created: 2026-04-01
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Use service account from vrcg-system env
const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!saJson) {
  console.error('Set GOOGLE_SERVICE_ACCOUNT_JSON env var');
  process.exit(1);
}

const sa = JSON.parse(saJson);
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// Roster data from Sheets (pasted by Vince)
const ROSTER_DATA: Record<string, Array<{
  performerId: string; name: string; email: string; pay: string;
  inquirySentAt?: string; inquiryOpenedAt?: string; inquiryResponse?: string; inquiryRespondedAt?: string;
  offerSentAt?: string; offerOpenedAt?: string; offerResponse?: string; offerRespondedAt?: string;
  confirmationSentAt?: string; confirmationOpenedAt?: string; confirmationResponse?: string; confirmationRespondedAt?: string;
}>> = {
  'SMNEY5VYG': [
    { performerId: 'P-0002', name: 'Daniel Twiford', email: 'danieltwiford@gmail.com', pay: '350', inquirySentAt: '2026-03-31T22:38:26.331Z', inquiryOpenedAt: '2026-03-31T22:38:32.843Z', inquiryResponse: 'Unavailable', inquiryRespondedAt: '2026-03-31T23:19:54.812Z' },
    { performerId: 'P-0004', name: 'Benjamin Lupton', email: 'luptonben@gmail.com', pay: '250', inquirySentAt: '2026-03-31T22:38:29.264Z', inquiryOpenedAt: '2026-03-31T22:38:31.897Z' },
    { performerId: 'P-0009', name: 'Ben Heidrich', email: 'ben.heidrich@gmail.com', pay: '250', inquirySentAt: '2026-03-31T22:38:31.924Z', inquiryOpenedAt: '2026-03-31T22:38:35.052Z', inquiryResponse: 'Unavailable', inquiryRespondedAt: '2026-03-31T22:53:19.300Z' },
    { performerId: 'P-0003', name: 'Glenn Ziser', email: 'glenn@ziserrealty.com', pay: '250', inquirySentAt: '2026-03-31T22:38:34.711Z', inquiryOpenedAt: '2026-03-31T22:50:52.356Z', inquiryResponse: 'Available', inquiryRespondedAt: '2026-03-31T23:48:48.253Z' },
    { performerId: 'P-0001', name: 'Vincent Romanelli', email: 'vince@vinceromanelli.com', pay: '350', inquirySentAt: '2026-03-31T22:38:02.665Z', inquiryOpenedAt: '2026-03-31T22:39:06.030Z', inquiryResponse: 'Available', inquiryRespondedAt: '2026-04-01T02:12:22.201Z' },
  ],
  'S202601121': [
    { performerId: 'P-0011', name: 'Emma Supica', email: 'emmasupica@gmail.com', pay: '800', inquirySentAt: '12/14/2025 21:18:58', inquiryResponse: 'Available', inquiryRespondedAt: '12/14/2025 22:54:25', offerSentAt: '2025-12-20T05:06:12.040Z', confirmationSentAt: '2026-01-04T16:28:56.405Z', confirmationOpenedAt: '2026-01-04T16:28:59.461Z', confirmationResponse: 'Confirmed', confirmationRespondedAt: '2026-01-06T00:21:23.056Z' },
    { performerId: 'P-0013', name: 'Jess Knoble', email: '13knoble@gmail.com', pay: '600', inquirySentAt: '12/14/2025 22:43:55', inquiryResponse: 'Available', inquiryRespondedAt: '12/15/2025 8:56:01', offerSentAt: '12/14/ 21:28:38', offerResponse: 'Accepted', offerRespondedAt: '12/14/2025 22:13:20', confirmationSentAt: '2026-01-04T16:29:01.108Z', confirmationOpenedAt: '2026-01-04T16:29:03.611Z', confirmationResponse: 'Confirmed', confirmationRespondedAt: '1/12/2026' },
    { performerId: 'P-0012', name: 'Mina Schwartz', email: 'wilhelminaraven118@gmail.com', pay: '600', inquirySentAt: '12/14/2025 21:19:35', inquiryResponse: 'Available', inquiryRespondedAt: '12/16/2025 17:09:29', offerSentAt: '2025-12-20T05:06:14.846Z', offerResponse: 'Accepted', offerRespondedAt: '2026-01-06T03:45:06.712Z', confirmationSentAt: '2026-01-04T16:29:03.829Z', confirmationOpenedAt: '2026-01-04T16:30:37.925Z', confirmationResponse: 'Confirmed', confirmationRespondedAt: '1/13/2026' },
    { performerId: 'P-0001', name: 'Vincent Romanelli', email: 'vince@vinceromanelli.com', pay: '100', inquirySentAt: '12/14/2025 21:20:00', inquiryResponse: 'Available', inquiryRespondedAt: '12/14/2025 21:27:36', offerSentAt: '12/14/ 21:28:48', offerResponse: 'Accepted', offerRespondedAt: '12/14/2025 21:31:47', confirmationSentAt: '2026-01-04T16:29:14.745Z', confirmationOpenedAt: '1/12/2026', confirmationResponse: 'Confirmed', confirmationRespondedAt: '2026-01-04T16:29:26.780Z' },
    { performerId: 'P-0016', name: 'Maite Cintron', email: 'maitecintronaguilo@gmail.com', pay: '600', inquirySentAt: '2025-12-24T16:05:07.988Z', inquiryOpenedAt: '2025-12-24T16:05:15.274Z', confirmationSentAt: '2026-01-08T21:36:03.835Z', confirmationOpenedAt: '2026-01-04T16:28:55.661Z' },
    { performerId: 'P-0017', name: 'Samantha Johnson', email: 'spicylife1580@gmail.com', pay: '600', inquirySentAt: '12/14/2025 21:24:57', inquiryResponse: 'Available', inquiryRespondedAt: '12/16/2025 2:59:21', offerSentAt: '12/16/2025', offerResponse: 'Accepted', offerRespondedAt: '12/16/2025 12:25:30', confirmationSentAt: '12/16/2025 11:21:13', confirmationOpenedAt: '1/12/2026 5:58:37', confirmationResponse: 'Confirmed', confirmationRespondedAt: '12/16/2025 15:44:52' },
  ],
};

async function main() {
  // Find Firestore docs by linkedShowId
  const snapshot = await db.collection('show_intelligence').get();
  const showMap = new Map<string, string>(); // linkedShowId -> firestoreDocId
  snapshot.docs.forEach(doc => {
    const lid = doc.data().linkedShowId;
    if (lid) showMap.set(lid, doc.id);
  });

  for (const [sheetShowId, performers] of Object.entries(ROSTER_DATA)) {
    const docId = showMap.get(sheetShowId);
    if (!docId) {
      console.log(`SKIP: No Firestore doc for ${sheetShowId}`);
      continue;
    }

    const statuses = performers.map(p => {
      if (p.confirmationResponse === 'Confirmed') return 'confirmed';
      if (p.offerResponse === 'Declined') return 'declined';
      if (p.inquiryResponse === 'Unavailable') return 'unavailable';
      if (p.offerResponse === 'Accepted') return 'offered';
      return 'inquired';
    });

    const roster = {
      totalPerformers: performers.length,
      confirmed: statuses.filter(s => s === 'confirmed').length,
      declined: statuses.filter(s => s === 'declined' || s === 'unavailable').length,
      pending: statuses.filter(s => s === 'inquired' || s === 'offered').length,
      performers: performers.map((p, i) => {
        // Strip undefined values manually
        const obj: Record<string, any> = {
          name: p.name,
          status: statuses[i],
          pay: p.pay,
          email: p.email,
          performerId: p.performerId,
        };
        if (p.inquirySentAt) obj.inquirySentAt = p.inquirySentAt;
        if (p.inquiryOpenedAt) obj.inquiryOpenedAt = p.inquiryOpenedAt;
        if (p.inquiryResponse) obj.inquiryResponse = p.inquiryResponse;
        if (p.inquiryRespondedAt) obj.inquiryRespondedAt = p.inquiryRespondedAt;
        if (p.offerSentAt) obj.offerSentAt = p.offerSentAt;
        if (p.offerOpenedAt) obj.offerOpenedAt = p.offerOpenedAt;
        if (p.offerResponse) obj.offerResponse = p.offerResponse;
        if (p.offerRespondedAt) obj.offerRespondedAt = p.offerRespondedAt;
        if (p.confirmationSentAt) obj.confirmationSentAt = p.confirmationSentAt;
        if (p.confirmationOpenedAt) obj.confirmationOpenedAt = p.confirmationOpenedAt;
        if (p.confirmationResponse) obj.confirmationResponse = p.confirmationResponse;
        if (p.confirmationRespondedAt) obj.confirmationRespondedAt = p.confirmationRespondedAt;
        return obj;
      }),
    };

    await db.collection('show_intelligence').doc(docId).update({
      roster,
      updatedAt: new Date().toISOString(),
    });
    console.log(`UPDATED: ${sheetShowId} (${docId}) — ${performers.length} performers with tracking`);
  }

  console.log('Done!');
}

main().catch(console.error);
