"use client"

import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase/config"

type BufferedResponse = {
  status: number
  statusText: string
  headers: [string, string][]
  body: ArrayBuffer
}

type AuthFetchInit = RequestInit & { dedupeKey?: string }

const inFlight = new Map<string, Promise<BufferedResponse>>()

async function getAuthToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem("demo_user") === "1") return "DEMO_TOKEN"
    } catch {
    }
  }

  try {
    const current = auth.currentUser
    if (current) return await current.getIdToken()
  } catch {
  }

  if (typeof window === "undefined") return null

  return await new Promise((resolve) => {
    let unsub: (() => void) | null = null

    const timeout = setTimeout(() => {
      try {
        unsub?.()
      } catch {
      }
      resolve(null)
    }, 1500)

    try {
      unsub = onAuthStateChanged(auth, async (user) => {
        clearTimeout(timeout)
        try {
          unsub?.()
        } catch {
        }

        if (!user) {
          resolve(null)
          return
        }

        try {
          const token = await user.getIdToken()
          resolve(token)
        } catch {
          resolve(null)
        }
      })
    } catch {
      clearTimeout(timeout)
      resolve(null)
    }
  })
}

export async function authFetch(input: RequestInfo | URL, init: AuthFetchInit = {}) {
  const { dedupeKey, ...requestInit } = init
  const token = await getAuthToken()
  const headers = new Headers(requestInit.headers || {})

  if (token) headers.set("Authorization", `Bearer ${token}`)

  const finalInit: RequestInit = { ...requestInit, headers }

  if (!dedupeKey) {
    return fetch(input, finalInit)
  }

  let pending = inFlight.get(dedupeKey)
  if (!pending) {
    pending = fetch(input, finalInit).then(async (res) => {
      const capturedHeaders: [string, string][] = []
      res.headers.forEach((value, key) => {
        capturedHeaders.push([key, value])
      })
      const body = await res.arrayBuffer()
      return {
        status: res.status,
        statusText: res.statusText,
        headers: capturedHeaders,
        body,
      }
    })

    inFlight.set(dedupeKey, pending)
    pending.finally(() => {
      inFlight.delete(dedupeKey)
    })
  }

  const buffered = await pending
  return new Response(buffered.body, {
    status: buffered.status,
    statusText: buffered.statusText,
    headers: buffered.headers,
  })
}
