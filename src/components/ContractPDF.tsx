/**
 * ContractPDF — @react-pdf/renderer Document for contract PDF export.
 * Simple one-pager performance agreement.
 * Created: 2026-04-01
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#64748b', textAlign: 'center', marginBottom: 30 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, fontSize: 9, color: '#64748b' },
  value: { flex: 1, fontSize: 10, color: '#1e293b' },
  paragraph: { fontSize: 10, color: '#334155', lineHeight: 1.6, marginBottom: 8 },
  sigBlock: { flexDirection: 'row', marginTop: 40, gap: 40 },
  sigLine: { flex: 1 },
  sigLabel: { fontSize: 8, color: '#94a3b8', marginTop: 4 },
  sigUnderline: { borderBottomWidth: 1, borderBottomColor: '#1e293b', height: 30 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8' },
});

interface ContractPDFProps {
  clientName: string;
  clientContact: string;
  clientEmail: string;
  eventName: string;
  eventDate: string;
  venue: string;
  city: string;
  state: string;
  performanceType: string;
  setLength: string;
  setupTime: string;
  totalFee: string;
  depositAmount: string;
  cancellationPolicy: string;
  dateIssued: string;
}

export default function ContractPDFDocument(props: ContractPDFProps) {
  const fee = parseFloat(props.totalFee?.replace(/[^0-9.]/g, '') || '0');
  const deposit = fee / 2;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>PERFORMANCE AGREEMENT</Text>
        <Text style={styles.subtitle}>VR Creative Group · Nashville, TN</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.row}><Text style={styles.label}>Performer:</Text><Text style={styles.value}>VR Creative Group (Vince Romanelli)</Text></View>
          <View style={styles.row}><Text style={styles.label}>Client:</Text><Text style={styles.value}>{props.clientName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Contact:</Text><Text style={styles.value}>{props.clientContact}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{props.clientEmail}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          <View style={styles.row}><Text style={styles.label}>Event:</Text><Text style={styles.value}>{props.eventName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Date:</Text><Text style={styles.value}>{props.eventDate}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Venue:</Text><Text style={styles.value}>{props.venue}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Location:</Text><Text style={styles.value}>{[props.city, props.state].filter(Boolean).join(', ')}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Terms</Text>
          <View style={styles.row}><Text style={styles.label}>Performance Type:</Text><Text style={styles.value}>{props.performanceType}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Set Length:</Text><Text style={styles.value}>{props.setLength}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Setup Time Required:</Text><Text style={styles.value}>{props.setupTime || '60 minutes'}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.row}><Text style={styles.label}>Total Fee:</Text><Text style={styles.value}>${fee.toLocaleString()}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Deposit (50%):</Text><Text style={styles.value}>${deposit.toLocaleString()} — due upon signing</Text></View>
          <View style={styles.row}><Text style={styles.label}>Balance (50%):</Text><Text style={styles.value}>${deposit.toLocaleString()} — due on event date</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.paragraph}>1. This agreement constitutes a binding contract between the parties named above.</Text>
          <Text style={styles.paragraph}>2. The deposit is non-refundable. Balance is due on the date of the event.</Text>
          <Text style={styles.paragraph}>3. Cancellation more than 60 days before event: deposit forfeited, no balance due. Cancellation 30-59 days: 50% of total fee due. Cancellation less than 30 days: full fee due.</Text>
          <Text style={styles.paragraph}>4. Performer reserves the right to substitute personnel of equal caliber if necessary.</Text>
          <Text style={styles.paragraph}>5. Client is responsible for providing adequate power, performance space, and load-in access as specified in the technical rider.</Text>
          <Text style={styles.paragraph}>6. Any changes to this agreement must be made in writing and signed by both parties.</Text>
        </View>

        <View style={styles.sigBlock}>
          <View style={styles.sigLine}>
            <View style={styles.sigUnderline} />
            <Text style={styles.sigLabel}>VR Creative Group — Date</Text>
          </View>
          <View style={styles.sigLine}>
            <View style={styles.sigUnderline} />
            <Text style={styles.sigLabel}>{props.clientName} — Date</Text>
          </View>
        </View>

        <Text style={styles.footer}>VR Creative Group · Vince Romanelli · vr@vrcreativegroup.com · Nashville, TN</Text>
      </Page>
    </Document>
  );
}
