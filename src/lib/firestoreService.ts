/**
 * Firestore CRUD service — direct client-side reads/writes.
 * No server needed. Firestore rules allow authenticated users.
 * Created: 2026-04-01
 */

import { db } from './firebase-client';
import {
  doc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type {
  ShowIntelligence,
  ShowChecklist,
  ChecklistItem,
  ShowConversation,
  PerformerPayable,
} from '../types/show';

// --- Show Intelligence ---

export function subscribeToShow(
  showId: string,
  callback: (show: ShowIntelligence | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'show_intelligence', showId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as ShowIntelligence);
    } else {
      callback(null);
    }
  });
}

export async function updateShowFields(
  showId: string,
  updates: Record<string, any>,
): Promise<void> {
  const ref = doc(db, 'show_intelligence', showId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

// --- Checklist ---

export function subscribeToChecklist(
  showId: string,
  callback: (checklist: ShowChecklist | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'show_checklists', showId), (snap) => {
    if (snap.exists()) {
      callback({ showId: snap.id, ...snap.data() } as ShowChecklist);
    } else {
      callback(null);
    }
  });
}

export async function updateChecklistItem(
  showId: string,
  itemId: string,
  updates: Partial<ChecklistItem>,
): Promise<void> {
  const ref = doc(db, 'show_checklists', showId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as ShowChecklist;
  const items = (data.items || []).map((item) =>
    item.id === itemId ? { ...item, ...updates } : item,
  );
  await updateDoc(ref, { items, updatedAt: new Date().toISOString() });
}

export async function addChecklistItem(
  showId: string,
  item: Omit<ChecklistItem, 'id'>,
): Promise<void> {
  const ref = doc(db, 'show_checklists', showId);
  const snap = await getDoc(ref);

  const newItem: ChecklistItem = {
    ...item,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  };

  if (snap.exists()) {
    const data = snap.data() as ShowChecklist;
    await updateDoc(ref, {
      items: [...(data.items || []), newItem],
      updatedAt: new Date().toISOString(),
    });
  } else {
    await setDoc(ref, {
      showId,
      items: [newItem],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function deleteChecklistItem(
  showId: string,
  itemId: string,
): Promise<void> {
  const ref = doc(db, 'show_checklists', showId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as ShowChecklist;
  const items = (data.items || []).filter((item) => item.id !== itemId);
  await updateDoc(ref, { items, updatedAt: new Date().toISOString() });
}

// --- Conversations ---

export function subscribeToConversations(
  showId: string,
  callback: (conversations: ShowConversation[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'show_conversations'),
    where('showId', '==', showId),
    orderBy('lastMessageAt', 'desc'),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShowConversation)),
      );
    },
    () => {
      // Index might not exist — fall back to unordered query
      const fallback = query(
        collection(db, 'show_conversations'),
        where('showId', '==', showId),
        limit(50),
      );
      onSnapshot(fallback, (snap) => {
        callback(
          snap.docs.map(
            (d) => ({ id: d.id, ...d.data() } as ShowConversation),
          ),
        );
      });
    },
  );
}

// --- Payables ---

export function subscribeToPayables(
  showDate: string | undefined,
  callback: (payables: PerformerPayable[]) => void,
): Unsubscribe {
  // Payables don't have showId — match by showDate if available, otherwise load recent
  if (showDate) {
    const q = query(
      collection(db, 'performer_payables'),
      where('showDate', '==', showDate),
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PerformerPayable)));
    });
  }
  // Fallback: load recent payables
  const q = query(
    collection(db, 'performer_payables'),
    orderBy('dueDate', 'asc'),
    limit(50),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PerformerPayable)));
  });
}
