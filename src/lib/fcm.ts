import { fcm } from "./firebase-admin";

export async function sendFcm(message: { token: string; title: string; body: string }) {
  return fcm.send({
    token: message.token,
    notification: { title: message.title, body: message.body },
  });
}
