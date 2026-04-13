/**
 * Brain Request Service — writes to brain_requests Firestore collection.
 * Chromebox Brain picks up and processes these requests.
 * Created: 2026-04-01
 */

import { db } from './firebase-client';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import type {
  BrainRequest,
  BrainRequestType,
  BrainRequestContext,
} from '../types/brain';

/**
 * Recursively strip undefined values from an object.
 * Firestore client SDK rejects undefined field values in setDoc().
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripUndefined(obj: Record<string, any>): Record<string, any> {
  const clean = {} as Record<string, any>;
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = stripUndefined(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      clean[key] = value.map((item: any) =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
          ? stripUndefined(item as Record<string, any>)
          : item
      );
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export async function createBrainRequest(params: {
  type: BrainRequestType;
  prompt: string;
  showId?: string;
  context?: BrainRequestContext;
}): Promise<string> {
  const docRef = doc(collection(db, 'brain_requests'));
  const now = new Date();
  const ttl = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const request: BrainRequest = {
    id: docRef.id,
    type: params.type,
    source: 'dashboard',
    prompt: params.prompt,
    status: 'pending',
    createdAt: now.toISOString(),
    ttl: ttl.toISOString(),
    ...(params.showId && { showId: params.showId }),
    ...(params.context && { context: params.context }),
  };

  await setDoc(docRef, stripUndefined(request as unknown as Record<string, any>));
  return docRef.id;
}

export function subscribeToBrainRequest(
  requestId: string,
  onUpdate: (request: BrainRequest) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const docRef = doc(db, 'brain_requests', requestId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() } as BrainRequest);
      }
    },
    (error) => {
      onError(error);
    },
  );
}
