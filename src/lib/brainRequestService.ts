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

  await setDoc(docRef, request);
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
