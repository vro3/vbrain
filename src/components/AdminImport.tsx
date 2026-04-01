/**
 * AdminImport — One-time roster data import. Visit /admin/import to run.
 * Writes all roster tracking data from ShowSync CSV directly to Firestore.
 * DELETE THIS FILE after import is complete.
 * Created: 2026-04-01
 */

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { db } from '../lib/firebase-client';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Full roster data from Vince's CSV export
// [ShowID, PerformerID, Name, Email, Pay, InqSent, InqOpened, InqResponse, InqRespondedAt, OfferSent, OfferOpened, OfferResponse, OfferRespondedAt, ConfSent, ConfOpened, ConfResponse, ConfRespondedAt]
const ROSTER: string[][] = [
["S202601121","P-0011","Emma Supica","emmasupica@gmail.com","800","12/14/2025 21:18:58","","Available","12/14/2025 22:54:25","2025-12-20T05:06:12.040Z","","","","2026-01-04T16:28:56.405Z","2026-01-04T16:28:59.461Z","Confirmed","2026-01-06T00:21:23.056Z"],
["S202601121","P-0013","Jess Knoble","13knoble@gmail.com","600","12/14/2025 22:43:55","","Available","12/15/2025 8:56:01","12/14/ 21:28:38","","Accepted","12/14/2025 22:13:20","2026-01-04T16:29:01.108Z","2026-01-04T16:29:03.611Z","Confirmed","1/12/2026"],
["S202601121","P-0012","Mina Schwartz","wilhelminaraven118@gmail.com","600","12/14/2025 21:19:35","","Available","12/16/2025 17:09:29","2025-12-20T05:06:14.846Z","","Accepted","2026-01-06T03:45:06.712Z","2026-01-04T16:29:03.829Z","2026-01-04T16:30:37.925Z","Confirmed","1/13/2026"],
["S202601121","P-0001","Vincent Romanelli","vince@vinceromanelli.com","100","12/14/2025 21:20:00","","Available","12/14/2025 21:27:36","12/14/ 21:28:48","","Accepted","12/14/2025 21:31:47","2026-01-04T16:29:14.745Z","1/12/2026","Confirmed","2026-01-04T16:29:26.780Z"],
["S202601121","P-0016","Maite Cintron","maitecintronaguilo@gmail.com","600","2025-12-24T16:05:07.988Z","2025-12-24T16:05:15.274Z","","","","","","","2026-01-08T21:36:03.835Z","2026-01-04T16:28:55.661Z","",""],
["S202601121","P-0017","Samantha Johnson","spicylife1580@gmail.com","600","12/14/2025 21:24:57","","Available","12/16/2025 2:59:21","12/16/2025","","Accepted","12/16/2025 12:25:30","12/16/2025 11:21:13","1/12/2026 5:58:37","Confirmed","12/16/2025 15:44:52"],
["S1765855503488","P-0002","Daniel Twiford","danieltwiford@gmail.com","400","12/15/2025 22:03:14","","Available","12/16/2025 4:23:12","2025-12-24T04:03:25.241Z","2025-12-24T04:03:31.403Z","","","2026-01-15T16:34:45.772Z","2025-12-31T15:45:23.479Z","Confirmed","2026-01-15T16:58:29.805Z"],
["S1765855503488","P-0004","Benjamin Lupton","luptonben@gmail.com","400","12/15/2025 22:03:25","","Available","12/16/2025 11:42:54","2025-12-24T04:03:33.492Z","2025-12-24T04:03:36.385Z","","","2026-01-15T16:34:46.924Z","2025-12-31T15:57:15.966Z","Confirmed","2025-12-31T21:31:51.310Z"],
["S1765855503488","P-0001","Vincent Romanelli","vince@vinceromanelli.com","400","12/15/2025 22:03:08","","Available","12/15/2025 22:15:57","2025-12-24T16:07:59.489Z","2025-12-24T04:04:20.427Z","","","2026-01-15T16:34:48.012Z","2025-12-31T15:47:13.851Z","Confirmed","2025-12-31T15:47:19.131Z"],
["S1765855503488","P-0009","Ben Heidrich","ben.heidrich@gmail.com","400","2026-01-07T15:38:12.805Z","2026-01-07T15:51:05.900Z","Available","2026-01-14T20:00:42.975Z","","","","","2026-01-15T16:34:49.098Z","2026-01-15T16:34:51.515Z","",""],
["S1765858236300","P-0004","Benjamin Lupton","luptonben@gmail.com","400","2025-12-31T15:49:31.272Z","2025-12-31T15:49:33.753Z","Available","2025-12-31T21:31:13.487Z","2026-01-08T20:06:25.181Z","2026-01-08T21:23:19.341Z","Accepted","2026-01-08T21:23:37.002Z","2026-01-17T04:09:17.325Z","2026-01-17T04:09:19.884Z","Confirmed","1/20/2026 6:39:53"],
["S1765858236300","P-0002","Daniel Twiford","danieltwiford@gmail.com","400","2025-12-31T15:49:39.148Z","2025-12-31T15:57:15.817Z","Available","2025-12-31T16:15:45.611Z","2026-01-08T20:06:33.216Z","2026-01-08T22:19:02.109Z","Accepted","2026-01-08T22:19:15.172Z","2026-01-17T04:09:18.492Z","2026-01-17T04:09:22.058Z","Confirmed","1/22/2026"],
["S1765858236300","P-0001","Vincent Romanelli","vince@vinceromanelli.com","400","12/15/2025 22:13:11","","Available","12/15/2025 22:16:03","2026-01-08T20:06:54.149Z","2026-01-08T20:11:54.277Z","Accepted","2026-01-08T20:11:56.628Z","2026-01-17T04:09:19.860Z","2026-01-17T04:22:15.213Z","Confirmed","2026-01-17T04:22:39.282Z"],
["S1765858236300","P-0009","Ben Heidrich","ben.heidrich@gmail.com","200","2026-01-17T04:05:17.688Z","2026-01-17T04:05:21.532Z","","","","","Accepted","","2026-01-17T04:09:20.890Z","2026-01-17T04:05:35.468Z","Confirmed","2026-01-20T04:42:56.948Z"],
["S1770059686078","P-0009","Ben Heidrich","ben.heidrich@gmail.com","300","2026-02-02T19:15:39.261Z","2026-02-03T04:47:20.345Z","","","","","","","2026-02-04T16:13:54.964Z","2026-02-04T16:42:13.611Z","",""],
["S1770059686078","P-0004","Benjamin Lupton","luptonben@gmail.com","400","2026-02-02T19:15:44.504Z","2026-02-03T20:09:47.858Z","","","","","","","2026-02-04T16:13:58.145Z","2026-02-04T16:54:34.361Z","",""],
["S1770059686078","P-0001","Vincent Romanelli","vince@vinceromanelli.com","400","2026-02-04T03:45:12.957Z","2026-02-04T03:47:04.044Z","","","2026-02-04T16:06:52.341Z","2026-02-04T16:07:08.259Z","","","2026-02-04T16:14:01.598Z","2026-02-04T16:14:06.881Z","",""],
["S1769718792036","mlu36576","Mike MIller","pianoman132@gmail.com","650","2026-02-19T23:24:58.601Z","2026-02-19T23:36:53.744Z","Available","2026-02-20T02:02:54.658Z","","","Accepted","","2026-03-03T19:53:05.394Z","2026-03-03T19:53:08.167Z","Confirmed",""],
["S1769718792036","mlu37gh1","Jason Saitta","Jasonmsaitta@gmail.com","600","2026-02-25T02:09:01.502Z","2026-02-19T23:25:04.436Z","Available","2026-02-25T04:37:20.377Z","","","Accepted","","2026-03-04T14:53:28.202Z","2026-03-03T19:53:12.478Z","Confirmed","2026-03-04T19:16:15.052Z"],
["S1769718792036","P-0001","Vincent Romanelli","vince@vinceromanelli.com","500","2026-02-25T02:09:04.554Z","2026-02-19T23:25:09.872Z","Available","2026-02-25T02:12:56.197Z","","","Accepted","","2026-03-06T15:07:51.999Z","2026-03-06T15:07:55.132Z","Confirmed","2026-03-06T15:08:10.630Z"],
["S1771543737492","mlu36576","Mike MIller","pianoman132@gmail.com","600","2026-02-25T02:11:26.922Z","2026-02-25T02:11:29.592Z","Available","2026-02-25T03:02:06.159Z","","","Accepted","","2026-03-06T15:27:25.010Z","2026-03-06T15:27:29.023Z","Confirmed",""],
["S1769718792038","P-0004","Benjamin Lupton","luptonben@gmail.com","325","2026-02-19T22:39:38.367Z","2026-02-19T23:00:07.766Z","Available","2026-02-20T23:25:37.153Z","","","","","2026-03-03T14:49:41.815Z","2026-03-03T14:49:46.241Z","Confirmed","2026-03-03T16:12:50.260Z"],
["S1769718792038","P-0009","Ben Heidrich","ben.heidrich@gmail.com","300","2026-02-25T02:11:55.417Z","2026-02-19T23:00:07.773Z","Available","2026-02-27T02:13:47.007Z","","","","","2026-03-03T14:49:45.538Z","2026-03-03T14:49:48.402Z","Confirmed","2026-03-04T19:46:04.734Z"],
["S1769718792038","P-0002","Daniel Twiford","danieltwiford@gmail.com","500","2026-02-20T18:52:31.055Z","2026-02-19T23:00:07.757Z","Available","2026-02-20T20:44:16.044Z","","","","","2026-03-03T14:49:49.411Z","2026-03-03T14:49:52.136Z","Confirmed","2026-03-06T20:08:54.878Z"],
["S1769718792038","P-0001","Vincent Romanelli","vince@vinceromanelli.com","300","2026-02-20T18:50:55.367Z","2026-02-19T23:31:12.313Z","Available","2026-02-20T18:51:10.004Z","","","Accepted","","2026-03-03T14:50:00.346Z","2026-03-03T14:51:02.660Z","Confirmed","2026-03-03T14:55:41.555Z"],
["S1769718792038","mlu36576","Mike MIller","pianoman132@gmail.com","300","2026-02-19T23:31:01.273Z","2026-02-19T23:36:53.787Z","Available","2026-02-20T02:03:23.955Z","","","Accepted","","2026-03-03T14:49:55.882Z","2026-03-03T14:49:59.182Z","Confirmed","2026-03-03T15:12:55.141Z"],
["S1769711675741","P-0001","Vincent Romanelli","vince@vinceromanelli.com","500","","","","","","","","","2026-02-21T01:07:02.427Z","2026-02-21T01:07:28.158Z","Confirmed","2026-02-21T01:19:59.939Z"],
["S1769718792037","P-0001","Vincent Romanelli","vince@vinceromanelli.com","1500","2026-02-25T02:10:55.917Z","2026-02-25T02:12:42.584Z","Available","2026-02-25T02:13:01.883Z","","","","","","","Confirmed",""],
["S1769718792041","P-0009","Ben Heidrich","ben.heidrich@gmail.com","600","2026-02-27T03:39:14.722Z","2026-02-27T03:39:17.615Z","Available","2026-02-27T16:06:05.696Z","","","","","","","Confirmed",""],
["S1769718792041","P-0001","Vincent Romanelli","vince@vinceromanelli.com","600","","","","","","","","","","","Confirmed",""],
["S1772163782110","P-0001","Vincent Romanelli","vince@vinceromanelli.com","500","","","","","","","","","2026-02-27T03:43:18.265Z","2026-02-27T03:43:29.321Z","Confirmed","2026-02-27T03:43:31.851Z"],
["S1771430538833","P-0003","Glenn Ziser","glenn@ziserrealty.com","600","2026-03-09T03:25:51.596Z","2026-02-18T16:20:08.286Z","Available","2026-03-09T16:50:13.361Z","2026-03-09T03:25:55.290Z","2026-03-09T04:02:19.257Z","","","2026-03-09T03:25:58.679Z","2026-03-09T04:02:18.671Z","Confirmed","2026-03-09T16:50:54.013Z"],
["S1768000768505","P-0003","Glenn Ziser","glenn@ziserrealty.com","800","2026-02-25T02:12:49.136Z","2026-02-05T04:20:02.838Z","Available","2026-02-25T04:26:37.810Z","","","","","2026-03-09T03:26:17.448Z","2026-03-09T04:02:14.952Z","Confirmed","2026-03-09T16:50:50.262Z"],
["SMNEY5VYG","P-0002","Daniel Twiford","danieltwiford@gmail.com","350","2026-03-31T22:38:26.331Z","2026-03-31T22:38:32.843Z","Unavailable","2026-03-31T23:19:54.812Z","","","","","","","",""],
["SMNEY5VYG","P-0004","Benjamin Lupton","luptonben@gmail.com","250","2026-03-31T22:38:29.264Z","2026-03-31T22:38:31.897Z","","","","","","","","","",""],
["SMNEY5VYG","P-0009","Ben Heidrich","ben.heidrich@gmail.com","250","2026-03-31T22:38:31.924Z","2026-03-31T22:38:35.052Z","Unavailable","2026-03-31T22:53:19.300Z","","","","","","","",""],
["SMNEY5VYG","P-0003","Glenn Ziser","glenn@ziserrealty.com","250","2026-03-31T22:38:34.711Z","2026-03-31T22:50:52.356Z","Available","2026-03-31T23:48:48.253Z","","","","","","","",""],
["SMNEY5VYG","P-0001","Vincent Romanelli","vince@vinceromanelli.com","350","2026-03-31T22:38:02.665Z","2026-03-31T22:39:06.030Z","Available","2026-04-01T02:12:22.201Z","","","","","","","",""],
];

export default function AdminImport() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const runImport = async () => {
    setStatus('running');
    addLog('Loading shows from Firestore...');

    const snap = await getDocs(collection(db, 'show_intelligence'));
    const showMap = new Map<string, string>();
    snap.docs.forEach(d => {
      const lid = d.data().linkedShowId;
      if (lid) showMap.set(lid, d.id);
    });
    addLog(`Found ${showMap.size} shows with linkedShowId`);

    // Group by ShowID
    const byShow = new Map<string, string[][]>();
    for (const r of ROSTER) {
      const sid = r[0];
      if (!byShow.has(sid)) byShow.set(sid, []);
      byShow.get(sid)!.push(r);
    }

    let updated = 0, skipped = 0;
    for (const [showId, performers] of byShow) {
      const docId = showMap.get(showId);
      if (!docId) { addLog(`SKIP: ${showId}`); skipped++; continue; }

      const rosterPerformers = performers.map(r => {
        const o: Record<string, any> = { name: r[2], email: r[3], performerId: r[1], pay: r[4] };
        if (r[15] === 'Confirmed') o.status = 'confirmed';
        else if (r[11] === 'Declined') o.status = 'declined';
        else if (r[7] === 'Unavailable') o.status = 'unavailable';
        else if (r[11] === 'Accepted') o.status = 'offered';
        else if (r[9]) o.status = 'offered';
        else o.status = 'inquired';
        if (r[5]) o.inquirySentAt = r[5];
        if (r[6]) o.inquiryOpenedAt = r[6];
        if (r[7]) o.inquiryResponse = r[7];
        if (r[8]) o.inquiryRespondedAt = r[8];
        if (r[9]) o.offerSentAt = r[9];
        if (r[10]) o.offerOpenedAt = r[10];
        if (r[11]) o.offerResponse = r[11];
        if (r[12]) o.offerRespondedAt = r[12];
        if (r[13]) o.confirmationSentAt = r[13];
        if (r[14]) o.confirmationOpenedAt = r[14];
        if (r[15]) o.confirmationResponse = r[15];
        if (r[16]) o.confirmationRespondedAt = r[16];
        return o;
      });

      const confirmed = rosterPerformers.filter(p => p.status === 'confirmed').length;
      const declined = rosterPerformers.filter(p => p.status === 'declined' || p.status === 'unavailable').length;
      const roster = { totalPerformers: rosterPerformers.length, confirmed, declined, pending: rosterPerformers.length - confirmed - declined, performers: rosterPerformers };

      await updateDoc(doc(db, 'show_intelligence', docId), { roster, updatedAt: new Date().toISOString() });
      addLog(`OK: ${showId} → ${rosterPerformers.length} performers (${confirmed} confirmed)`);
      updated++;
    }
    addLog(`Done! Updated ${updated}, skipped ${skipped}`);
    setStatus('done');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Roster Data Import</h1>
      <p className="text-sm text-slate-400">{ROSTER.length} roster rows from ShowSync CSV, covering {new Set(ROSTER.map(r => r[0])).size} shows.</p>
      {status === 'idle' && (
        <button onClick={runImport} className="bg-amber-500 text-slate-950 px-6 py-3 rounded-lg font-bold text-sm hover:bg-amber-400">
          Import All Roster Data
        </button>
      )}
      {status === 'running' && <div className="flex items-center gap-2 text-amber-400"><Loader2 className="animate-spin" size={20} /> Importing...</div>}
      {status === 'done' && <div className="flex items-center gap-2 text-emerald-400"><Check size={20} /> Import complete!</div>}
      {log.length > 0 && (
        <div className="bg-slate-950 border border-white/6 rounded-xl p-4 max-h-96 overflow-y-auto">
          {log.map((line, i) => (
            <div key={i} className={`text-xs font-mono ${line.startsWith('SKIP') ? 'text-amber-400' : line.startsWith('OK') ? 'text-emerald-400' : 'text-slate-400'}`}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
