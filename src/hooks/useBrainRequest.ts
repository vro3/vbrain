/**
 * useBrainRequest — React hook for the brain_requests Firestore queue.
 * Write request, subscribe via onSnapshot, 3-min timeout.
 * Created: 2026-04-01
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createBrainRequest,
  subscribeToBrainRequest,
} from '../lib/brainRequestService';
import type {
  BrainRequest,
  BrainRequestType,
  BrainRequestContext,
  BrainRequestResult,
  BrainRequestStatus,
} from '../types/brain';
import type { Unsubscribe } from 'firebase/firestore';

const BRAIN_TIMEOUT_MS = 3 * 60 * 1000;

export interface UseBrainRequestReturn {
  sendRequest: (params: {
    type: BrainRequestType;
    prompt: string;
    showId?: string;
    context?: BrainRequestContext;
  }) => Promise<string>;
  status: BrainRequestStatus | 'idle' | 'timeout';
  result: BrainRequestResult | null;
  error: string | null;
  isWorking: boolean;
  isTimedOut: boolean;
  reset: () => void;
}

export function useBrainRequest(): UseBrainRequestReturn {
  const [status, setStatus] = useState<BrainRequestStatus | 'idle' | 'timeout'>('idle');
  const [result, setResult] = useState<BrainRequestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      unsubRef.current?.();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const cleanup = useCallback(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setStatus('idle');
    setResult(null);
    setError(null);
  }, [cleanup]);

  const sendRequest = useCallback(async (params: {
    type: BrainRequestType;
    prompt: string;
    showId?: string;
    context?: BrainRequestContext;
  }): Promise<string> => {
    cleanup();
    setStatus('pending');
    setResult(null);
    setError(null);

    const requestId = await createBrainRequest(params);

    timeoutRef.current = setTimeout(() => {
      setStatus('timeout');
      unsubRef.current?.();
      unsubRef.current = null;
    }, BRAIN_TIMEOUT_MS);

    unsubRef.current = subscribeToBrainRequest(
      requestId,
      (request: BrainRequest) => {
        setStatus(request.status);
        if (request.status === 'complete') {
          setResult(request.result || null);
          cleanup();
        } else if (request.status === 'error') {
          setError(request.error || 'Brain encountered an error');
          cleanup();
        }
      },
      (err: Error) => {
        setError(err.message);
        setStatus('error');
        cleanup();
      },
    );

    return requestId;
  }, [cleanup]);

  return {
    sendRequest,
    status,
    result,
    error,
    isWorking: status === 'pending' || status === 'processing',
    isTimedOut: status === 'timeout',
    reset,
  };
}
