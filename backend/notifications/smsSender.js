const NotificationLog = require('../models/NotificationLog');
// Assumes you already have a configured Twilio client elsewhere for OTP —
// reuse that client/config rather than creating a second one.
const twilioClient = require('../config/twilio'); // adjust path to your existing OTP setup

/**
 * Sends one templated SMS and logs the attempt. Silently skips (returns
 * without throwing) if this user already got this message type today,
 * so a job re-run or overlap doesn't spam people.
 */
async function sendSms(user, type, messageBody) {
  const alreadySentToday = await NotificationLog.findOne({
    user: user._id,
    type,
    channel: 'sms',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (alreadySentToday) return { skipped: true };

  try {
    await twilioClient.messages.create({
      body: messageBody,
      to: user.phone,
      from: process.env.TWILIO_FROM_NUMBER,
    });
    await NotificationLog.create({ user: user._id, type, channel: 'sms', status: 'sent' });
    return { sent: true };
  } catch (err) {
    await NotificationLog.create({
      user: user._id,
      type,
      channel: 'sms',
      status: 'failed',
      errorMessage: err.message,
    });
    return { sent: false, error: err.message };
  }
}

module.exports = { sendSms };

// NOTE: push notifications need a device token + provider (FCM/OnePush/etc.)
// which isn't in your stack yet. Stubbed out separately in pushSender.js —
// wire it up once you pick a provider; SMS via Twilio can ship today.