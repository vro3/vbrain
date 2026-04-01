/**
 * BrainActionButton — Reusable button that sends a brain_request and shows status.
 * idle → working (spinner) → complete (checkmark) → error (red + retry)
 * Created: 2026-04-01
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { useBrainRequest } from '../hooks/useBrainRequest';
import type { BrainRequestType, BrainRequestContext, BrainRequestResult } from '../types/brain';

interface BrainActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  request: {
    type: BrainRequestType;
    prompt: string;
    showId?: string;
    context?: BrainRequestContext;
  };
  onComplete?: (result: BrainRequestResult) => void;
  onError?: (error: string) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
}

const variantStyles = {
  primary: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
  secondary: 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-[10px]',
  md: 'px-3 py-1.5 text-xs',
};

type ButtonState = 'idle' | 'working' | 'complete' | 'error' | 'timeout';

export default function BrainActionButton({
  label,
  icon,
  request,
  onComplete,
  onError,
  variant = 'secondary',
  size = 'sm',
  disabled = false,
}: BrainActionButtonProps) {
  const brain = useBrainRequest();
  const [state, setState] = useState<ButtonState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (brain.status === 'complete' && brain.result) {
      setState('complete');
      onComplete?.(brain.result);
      brain.reset();
      setTimeout(() => setState('idle'), 2000);
    } else if (brain.status === 'error') {
      setState('error');
      setErrorMsg(brain.error || 'Brain error');
      onError?.(brain.error || 'Brain error');
      brain.reset();
    } else if (brain.isTimedOut) {
      setState('timeout');
      brain.reset();
    } else if (brain.isWorking) {
      setState('working');
    }
  }, [brain.status, brain.result, brain.error, brain.isTimedOut, brain.isWorking]);

  const handleClick = useCallback(async () => {
    if (state === 'error' || state === 'timeout') {
      setState('idle');
      setErrorMsg('');
      return;
    }
    setState('working');
    try {
      await brain.sendRequest(request);
    } catch (err: any) {
      setState('error');
      setErrorMsg(err.message);
    }
  }, [state, request, brain]);

  const isDisabled = disabled || state === 'working';

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`rounded-md font-bold uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1.5 ${variantStyles[variant]} ${sizeStyles[size]}`}
      >
        {state === 'working' && <Loader2 size={12} className="animate-spin" />}
        {state === 'complete' && <Check size={12} className="text-emerald-500" />}
        {state === 'error' && <AlertTriangle size={12} />}
        {state === 'idle' && icon}
        {state === 'working' ? 'Processing...' : state === 'complete' ? 'Done' : state === 'error' ? 'Retry' : state === 'timeout' ? 'Offline' : label}
      </button>
      {state === 'timeout' && (
        <span className="text-[10px] text-amber-400">Brain may be offline</span>
      )}
      {state === 'error' && errorMsg && (
        <span className="text-[10px] text-red-400 max-w-[120px] truncate">{errorMsg}</span>
      )}
    </div>
  );
}
