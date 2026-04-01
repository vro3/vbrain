/**
 * useShowDetail — Centralized hook for show data + mutations.
 * Single subscription point for all ShowDetail tabs.
 * Created: 2026-04-01
 */

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToShow,
  subscribeToChecklist,
  subscribeToConversations,
  subscribeToPayables,
  updateShowFields as firestoreUpdateShowFields,
} from '../lib/firestoreService';
import type {
  ShowIntelligence,
  ShowChecklist,
  ShowConversation,
  PerformerPayable,
} from '../types/show';

export interface UseShowDetailReturn {
  show: ShowIntelligence | null;
  checklist: ShowChecklist | null;
  conversations: ShowConversation[];
  payables: PerformerPayable[];
  loading: boolean;
  saving: boolean;
  saveError: string | null;
  updateField: (field: string, value: any) => Promise<void>;
  updateFields: (updates: Record<string, any>) => Promise<void>;
}

export function useShowDetail(showId: string | undefined): UseShowDetailReturn {
  const [show, setShow] = useState<ShowIntelligence | null>(null);
  const [checklist, setChecklist] = useState<ShowChecklist | null>(null);
  const [conversations, setConversations] = useState<ShowConversation[]>([]);
  const [payables, setPayables] = useState<PerformerPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!showId) {
      setLoading(false);
      return;
    }

    let showLoaded = false;

    const unsubs = [
      subscribeToShow(showId, (s) => {
        setShow(s);
        if (!showLoaded) {
          showLoaded = true;
          setLoading(false);
        }
      }),
      subscribeToChecklist(showId, setChecklist),
      subscribeToConversations(showId, setConversations),
      subscribeToPayables(undefined, setPayables),
    ];

    return () => unsubs.forEach((u) => u());
  }, [showId]);

  const updateField = useCallback(
    async (field: string, value: any) => {
      if (!showId) return;
      setSaving(true);
      setSaveError(null);
      try {
        await firestoreUpdateShowFields(showId, { [field]: value });
      } catch (err: any) {
        setSaveError(err.message);
      } finally {
        setSaving(false);
      }
    },
    [showId],
  );

  const updateFields = useCallback(
    async (updates: Record<string, any>) => {
      if (!showId) return;
      setSaving(true);
      setSaveError(null);
      try {
        await firestoreUpdateShowFields(showId, updates);
      } catch (err: any) {
        setSaveError(err.message);
      } finally {
        setSaving(false);
      }
    },
    [showId],
  );

  return {
    show,
    checklist,
    conversations,
    payables,
    loading,
    saving,
    saveError,
    updateField,
    updateFields,
  };
}
