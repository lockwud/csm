export const fcm = {
  async send(message: unknown) {
    return { id: crypto.randomUUID(), message };
  },
};

const firebaseAdmin = { apps: [], messaging: () => fcm };

export default firebaseAdmin;
