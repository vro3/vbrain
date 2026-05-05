/**
 * useAuth — Firebase Auth hook with Google sign-in.
 * Restricts access to allowed emails only.
 * Created: 2026-04-01
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase-client';

const ALLOWED_EMAILS = [
  'vince@vinceromanelli.com',
  'vr@vrcreativegroup.com',
];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle redirect result when returning from Google sign-in
    getRedirectResult(auth).then((result) => {
      if (result?.user && !ALLOWED_EMAILS.includes(result.user.email || '')) {
        signOut(auth);
        setError('Access denied. Not an authorized account.');
      }
    }).catch((err) => {
      setError(err.message);
    });

    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !ALLOWED_EMAILS.includes(u.email || '')) {
        signOut(auth);
        setUser(null);
        setError('Access denied. Not an authorized account.');
      } else {
        setUser(u);
        setError(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = () => {
    setError(null);
    signInWithRedirect(auth, googleProvider);
  };

  const logout = () => signOut(auth);

  return { user, loading, error, login, logout };
}
