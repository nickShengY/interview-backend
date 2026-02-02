"use client"

import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut as fbSignOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface SessionUser {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}

export interface UseSessionResult {
  data: { user: SessionUser } | null
  status: SessionStatus
}

const DEMO_USER = {
  id: 'demo-user-uid-12345',
  email: 'demo@interview-plus.app',
  name: 'Demo User',
  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
}

function getDemoEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('demo_user') === '1'
}

function setDemoEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  if (enabled) localStorage.setItem('demo_user', '1')
  else localStorage.removeItem('demo_user')
}

export function useSession(): UseSessionResult {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    // Demo mode takes precedence
    if (getDemoEnabled()) {
      setUser(DEMO_USER)
      setStatus('authenticated')
      return
    }

    // Firebase auth listener
    try {
      const unsub = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          setUser({
            id: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName,
            image: fbUser.photoURL,
          })
          setStatus('authenticated')
        } else {
          setUser(null)
          setStatus('unauthenticated')
        }
      })
      return () => unsub()
    } catch {
      // If Firebase not configured yet, fall back to unauthenticated
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [])

  return { data: user ? { user } : null, status }
}

export async function signIn(provider?: string) {
  // If Firebase is configured, allow Google popup
  try {
    if (provider === 'google') {
      const providerObj = new GoogleAuthProvider()
      await signInWithPopup(auth, providerObj)
      return
    }
  } catch {
    // ignore and fall back to demo below
  }
  // Fallback: enable demo user session
  setDemoEnabled(true)
}

export async function signOut() {
  setDemoEnabled(false)
  try {
    await fbSignOut(auth)
  } catch {
    // ignore
  }
}
