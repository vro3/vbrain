/**
 * Brain Request types — shared contract between Dashboard and Chromebox Brain.
 * Mirrors @vrcg/shared/types/brainRequest.ts
 * Created: 2026-04-01
 */

export type BrainRequestType = 'query' | 'action' | 'smart_create' | 'email_scan';
export type BrainRequestStatus = 'pending' | 'processing' | 'complete' | 'error';
export type BrainRequestSource = 'dashboard' | 'cron';

export interface BrainRequestContext {
  pastedText?: string;
  actionSteps?: Array<{
    tool: string;
    params: Record<string, any>;
  }>;
  emailId?: string;
}

export interface BrainRequestResult {
  answer?: string;
  data?: Record<string, any>;
  cachedTo?: string;
}

export interface BrainRequest {
  id: string;
  type: BrainRequestType;
  source: BrainRequestSource;
  prompt: string;
  showId?: string;
  context?: BrainRequestContext;
  status: BrainRequestStatus;
  createdAt: string;
  startedAt?: string;
  result?: BrainRequestResult;
  completedAt?: string;
  error?: string;
  ttl: string;
}
