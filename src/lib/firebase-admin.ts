import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging, type Message } from "firebase-admin/messaging";

function parseServiceAccount() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const json = rawJson.trim().startsWith("{") ? rawJson : Buffer.from(rawJson, "base64").toString("utf8");
    return cert(JSON.parse(json));
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }

  return applicationDefault();
}

function getFirebaseAdminApp(): App {
  if (getApps().length) return getApps()[0];

  return initializeApp({
    credential: parseServiceAccount(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const fcm = {
  send(message: Message) {
    return getMessaging(getFirebaseAdminApp()).send(message);
  },
};

export default getFirebaseAdminApp;
