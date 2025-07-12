
import { initializeApp, getApps, cert, AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!getApps().length) {
  let appOptions: AppOptions = {};

  // If a service account is provided via environment variables, use it.
  // This is useful for local development or non-Firebase environments.
  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      appOptions.credential = cert(serviceAccount);
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
    }
  }
  
  // Initialize the app. If appOptions is empty, the SDK will attempt
  // to discover credentials automatically from the environment (e.g., in App Hosting).
  initializeApp(appOptions);
}

export const db = getFirestore();
