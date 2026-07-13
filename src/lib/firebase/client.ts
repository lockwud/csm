"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import {
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export async function initFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  if (!(await isAnalyticsSupported())) return null;
  return getAnalytics(getFirebaseApp());
}

export async function registerWebPushToken() {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
  if (!(await isMessagingSupported())) return null;

  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const messaging = getMessaging(getFirebaseApp());
  if (!firebaseVapidKey) return null;
  const token = await getToken(messaging, {
    vapidKey: firebaseVapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) return null;

  await fetch("/api/notifications/device-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform: "WEB" }),
  });

  return token;
}

export async function listenForForegroundMessages(callback: (payload: MessagePayload) => void) {
  if (typeof window === "undefined") return () => {};
  if (!(await isMessagingSupported())) return () => {};

  const messaging = getMessaging(getFirebaseApp());
  return onMessage(messaging, callback);
}
