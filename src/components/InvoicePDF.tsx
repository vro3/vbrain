/**
 * InvoicePDF — @react-pdf/renderer Document for invoice PDF export.
 * Matches the VRCG invoice layout.
 * Created: 2026-04-01
 */

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  company: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  companyAddress: { fontSize: 9, color: '#64748b', marginTop: 4, lineHeight: 1.5 },
  invoiceTitle: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', textAlign: 'right' },
  invoiceNumber: { fontSize: 10, color: '#64748b', textAlign: 'right', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  infoGrid: { flexDirection: 'row', gap: 40, marginBottom: 20 },
  infoBlock: { flex: 1 },
  label: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 10, color: '#1e293b' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 6, marginBottom: 8 },
  tableHeaderCell: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  tableCell: { fontSize: 10, color: '#1e293b' },
  descCol: { width: '50%' },
  qtyCol: { width: '15%', textAlign: 'center' },
  rateCol: { width: '20%', textAlign: 'right' },
  totalCol: { width: '15%', textAlign: 'right' },
  totalsSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', width: 200, paddingVertical: 4 },
  totalLabel: { fontSize: 10, color: '#64748b', width: 100 },
  totalValue: { fontSize: 10, color: '#1e293b', width: 100, textAlign: 'right' },
  grandTotal: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  grandTotalLabel: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', width: 100 },
  notes: { marginTop: 30, padding: 16, backgroundColor: '#f8fafc', borderRadius: 4 },
  notesText: { fontSize: 9, color: '#64748b', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8' },
});

interface LineItem {
  description: string;
  quantity: number;
  price: number;
}

interface InvoicePDFProps {
  invoiceNumber: string;
  dateIssued: string;
  dateDue: string;
  clientName: string;
  billToAddress: string;
  eventName: string;
  eventDate: string;
  items: LineItem[];
  taxRate: number;
  notes: string;
  paymentTerms: string;
  fromName: string;
  fromAddress: string;
  fromEmail: string;
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function InvoicePDFDocument(props: InvoicePDFProps) {
  const subtotal = props.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const tax = subtotal * (props.taxRate / 100);
  const total = subtotal + tax;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.company}>{props.fromName}</Text>
            <Text style={styles.companyAddress}>{props.fromAddress.replace(/\n/g, '\n')}</Text>
            <Text style={styles.companyAddress}>{props.fromEmail}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{props.invoiceNumber}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.value}>{props.clientName}</Text>
            <Text style={styles.companyAddress}>{props.billToAddress}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Date Issued</Text>
            <Text style={styles.value}>{props.dateIssued}</Text>
            <Text style={{ ...styles.label, marginTop: 8 }}>Date Due</Text>
            <Text style={styles.value}>{props.dateDue}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Event</Text>
            <Text style={styles.value}>{props.eventName}</Text>
            <Text style={{ ...styles.label, marginTop: 8 }}>Event Date</Text>
            <Text style={styles.value}>{props.eventDate}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, ...styles.descCol }}>Description</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.qtyCol }}>Qty</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.rateCol }}>Rate</Text>
            <Text style={{ ...styles.tableHeaderCell, ...styles.totalCol }}>Amount</Text>
          </View>
          {props.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, ...styles.descCol }}>{item.description}</Text>
              <Text style={{ ...styles.tableCell, ...styles.qtyCol }}>{item.quantity}</Text>
              <Text style={{ ...styles.tableCell, ...styles.rateCol }}>${fmt(item.price)}</Text>
              <Text style={{ ...styles.tableCell, ...styles.totalCol }}>${fmt(item.quantity * item.price)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${fmt(subtotal)}</Text>
          </View>
          {props.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({props.taxRate}%)</Text>
              <Text style={styles.totalValue}>${fmt(tax)}</Text>
            </View>
          )}
          <View style={{ ...styles.totalRow, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 4 }}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotal}>${fmt(total)}</Text>
          </View>
        </View>

        {/* Payment Terms */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Payment Terms</Text>
          <Text style={styles.value}>{props.paymentTerms}</Text>
        </View>

        {/* Notes */}
        {props.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.notesText}>{props.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>{props.fromName} · {props.fromEmail}</Text>
      </Page>
    </Document>
  );
}
