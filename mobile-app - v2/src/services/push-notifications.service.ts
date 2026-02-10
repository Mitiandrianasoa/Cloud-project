import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

let initialized = false;
let pendingToken: string | null = null;

async function persistToken(token: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    pendingToken = token;
    return;
  }

  await setDoc(
    doc(db, 'users', user.uid),
    {
      fcmToken: token,
      fcmTokenUpdatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function initPush(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (!Capacitor.isNativePlatform()) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    if (!pendingToken) return;

    const tokenToPersist = pendingToken;
    pendingToken = null;

    persistToken(tokenToPersist).catch((err) => {
      console.error('Failed to persist FCM token:', err);
    });
  });

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return;

  await PushNotifications.register();

  await PushNotifications.addListener('registration', async (token) => {
    console.log('FCM Token:', token.value);
    try {
      await persistToken(token.value);
    } catch (err) {
      console.error('Failed to persist FCM token:', err);
    }
  });

  await PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Notification reçue', notification);
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Notification cliquée', notification);
  });
}
