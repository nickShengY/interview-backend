import { cert, getApps, initializeApp, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let _adminApp: App | null = null

function canInit() {
  return (
    !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY
  )
}

export function getAdminAuth(): Auth | null {
  if (!canInit()) return null
  if (_adminApp) return getAuth(_adminApp)
  try {
    const app =
      getApps().length === 0
        ? initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
            }),
          })
        : getApps()[0]
    _adminApp = app
    return getAuth(app)
  } catch {
    // If misconfigured, do not crash in development/demo mode
    return null
  }
}
