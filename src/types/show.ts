/**
 * ShowIntelligence types for vBrain — mirrors show_intelligence Firestore collection.
 * Ported from vrcg-system/core/dashboard/src/types/atlas.ts
 * Created: 2026-04-01
 */

export interface ShowContact {
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
}

export interface ShowFile {
  title: string;
  url: string;
  type: 'contract' | 'rider' | 'invoice' | 'w9' | 'coi' | 'schedule' | 'map' | 'other';
  uploadedAt?: string;
}

export interface ShowSourceEmail {
  messageId: string;
  subject: string;
  from: string;
  date: string;
  extractedFields: string[];
}

export interface RosterPerformer {
  name: string;
  status: 'confirmed' | 'offered' | 'inquired' | 'declined' | 'unavailable';
  pay: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface ShowRoster {
  totalPerformers: number;
  confirmed: number;
  declined: number;
  pending: number;
  performers: RosterPerformer[];
}

export type ShowStatus = 'inquiry' | 'quoted' | 'confirmed' | 'completed' | 'cancelled' | 'hold';

export interface ShowIntelligence {
  id: string;
  matchKeys?: {
    date?: string;
    clientName?: string;
    clientEmail?: string;
    agentName?: string;
    agentEmail?: string;
    venueName?: string;
  };
  eventName?: string;
  eventType?: string;
  clientName?: string;
  clientCompany?: string;
  clientContacts?: ShowContact[];
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  ballroom?: string;
  showDate?: string;
  loadInDate?: string;
  loadInTime?: string;
  soundCheckTime?: string;
  doorsTime?: string;
  performanceStartTime?: string;
  performanceEndTime?: string;
  breakdownTime?: string;
  parkingInstructions?: string;
  loadingDockInfo?: string;
  onsiteContact?: ShowContact;
  greenRoom?: string;
  wifi?: { network?: string; password?: string };
  dressingRoom?: string;
  mealProvided?: boolean;
  mealTime?: string;
  setLength?: string;
  numberOfSets?: number;
  performerCount?: number;
  costumeNotes?: string;
  stageDimensions?: string;
  powerRequirements?: string;
  fee?: string;
  depositAmount?: string;
  depositDue?: string;
  balanceDue?: string;
  travelBudget?: string;
  files?: ShowFile[];
  sourceEmails?: ShowSourceEmail[];
  linkedShowId?: string;
  linkedShowName?: string;
  roster?: ShowRoster;
  status?: ShowStatus;
  completeness?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Checklist types
export type ChecklistItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type ChecklistItemPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  category?: string;
  priority?: ChecklistItemPriority;
  status: ChecklistItemStatus;
  completedAt?: string;
  completedBy?: string;
  actionType?: string;
  actionParams?: Record<string, any>;
  dependsOn?: string;
}

export interface ShowChecklist {
  showId: string;
  items: ChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Conversation types
export interface ConversationMessage {
  id: string;
  from: { name: string; email: string };
  to?: Array<{ name: string; email: string }>;
  date: string;
  content: string;
  type?: 'email' | 'note' | 'call_log';
}

export interface ConversationSummary {
  summary: string;
  keyPoints?: string[];
  timeline?: Array<{ date: string; event: string }>;
  contacts?: Array<{ name: string; email: string; role?: string }>;
  openQuestions?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency?: 'low' | 'medium' | 'high';
}

export interface ShowConversation {
  id: string;
  showId?: string;
  threadId?: string;
  subject: string;
  messages: ConversationMessage[];
  summary?: ConversationSummary;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Payable types
export interface PerformerPayable {
  id: string;
  vendorName?: string;
  performerName?: string;
  amount?: number;
  status?: string;
  showDate?: string;
  showName?: string;
  showId?: string;
  invoiceNumber?: string;
  w9Status?: string;
}
