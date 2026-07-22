/**
 * STUB — push notifications need a device-token field on User and a
 * provider (Firebase Cloud Messaging, OneSignal, etc.) that isn't in the
 * stack yet. This file documents the shape so wiring it up later is a
 * drop-in, not a redesign.
 *
 * To activate:
 * 1. Add `pushToken: String` to the User schema, set on app login.
 * 2. Pick a provider SDK and replace the throw below with a real send call.
 * 3. Everything else (logging, skip-if-already-sent-today) mirrors smsSender.js.
 */

const NotificationLog = require('../models/NotificationLog');

async function sendPush(user, type, { title, body }) {
  if (!user.pushToken) {
    return { skipped: true, reason: 'no push token on file' };
  }

  const alreadySentToday = await NotificationLog.findOne({
    user: user._id,
    type,
    channel: 'push',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (alreadySentToday) return { skipped: true };

  try {
    // Replace with real provider call, e.g.:
    // await fcm.send({ token: user.pushToken, notification: { title, body } });
    throw new Error('Push provider not configured yet');
  } catch (err) {
    await NotificationLog.create({
      user: user._id,
      type,
      channel: 'push',
      status: 'failed',
      errorMessage: err.message,
    });
    return { sent: false, error: err.message };
  }
}

module.exports = { sendPush };