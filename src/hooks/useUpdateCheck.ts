/**
 * useUpdateCheck — Polls for new deployments by comparing script hashes.
 * Shows update banner when a new version is detected.
 * Created: 2026-04-01
 */

import { useState, useEffect, useRef } from 'react';

function getScriptSrcs(): string[] {
  return Array.from(document.querySelectorAll('script[src]'))
    .map(s => (s as HTMLScriptElement).src)
    .filter(src => src.includes('/assets/'));
}

export function useUpdateCheck(intervalMs = 2 * 60 * 1000) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialSrcs = useRef<string[]>(getScriptSrcs());

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(window.location.origin + '/?_vc=' + Date.now(), {
          cache: 'no-store',
          headers: { Accept: 'text/html' },
        });
        const html = await res.text();
        const currentSrcs = initialSrcs.current;
        const missing = currentSrcs.some(src => {
          const filename = src.split('/').pop() || '';
          return !html.includes(filename);
        });
        if (missing) setUpdateAvailable(true);
      } catch {
        // Network error, skip
      }
    };

    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const hardUpdate = async () => {
    // Clear all caches
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(n => caches.delete(n)));
    }
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    // Reload with cache bust
    window.location.href = window.location.origin + '?v=' + Date.now();
  };

  return { updateAvailable, hardUpdate };
}
