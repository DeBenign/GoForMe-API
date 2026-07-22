const { Queue, Worker } = require('bullmq');
const User = require('../models/User');
const Order = require('../models/Order');
const templates = require('./templates');
const { sendSms } = require('./smsSender');

// Reuse your existing Redis connection config for BullMQ rather than
// creating a new one — adjust this import to match your setup.
const connection = require('../config/redis');

const QUEUE_NAME = 're-engagement';
const reEngagementQueue = new Queue(QUEUE_NAME, { connection });

/**
 * Repeatable job: runs once daily. Scans for two audiences:
 * - customers whose last completed order was ~7 days ago (repeat-errand nudge)
 * - customers with no completed order in 30+ days (dormant winback)
 * Chosen thresholds are a starting point — tune once you have real data on
 * typical reorder cadence.
 */
async function scheduleDaily() {
  await reEngagementQueue.add(
    'daily-scan',
    {},
    {
      repeat: { pattern: '0 9 * * *' }, // 9am daily — adjust to your users' active hours
      jobId: 'daily-reengagement-scan', // fixed id prevents duplicate repeatables
    }
  );
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    if (job.name !== 'daily-scan') return;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoStart = new Date(sevenDaysAgo);
    sevenDaysAgoStart.setHours(0, 0, 0, 0);
    const sevenDaysAgoEnd = new Date(sevenDaysAgo);
    sevenDaysAgoEnd.setHours(23, 59, 59, 999);

    // --- Repeat-errand nudge: last completed order was ~exactly 7 days ago
    const repeatCandidates = await Order.aggregate([
      { $match: { status: 'completed', updatedAt: { $gte: sevenDaysAgoStart, $lte: sevenDaysAgoEnd } } },
      { $sort: { updatedAt: -1 } },
      { $group: { _id: '$customer', lastOrder: { $first: '$$ROOT' } } },
    ]);

    for (const { _id: userId, lastOrder } of repeatCandidates) {
      const user = await User.findById(userId);
      if (!user) continue;
      const template = templates.REPEAT_ERRAND_NUDGE;
      await sendSms(user, 'REPEAT_ERRAND_NUDGE', template.sms(user.name, lastOrder.serviceType || 'errand'));
    }

    // --- Dormant winback: no completed order in 30+ days, but at least one ever
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dormantUserIds = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$customer', lastOrderAt: { $max: '$updatedAt' } } },
      { $match: { lastOrderAt: { $lt: thirtyDaysAgo } } },
    ]);

    for (const { _id: userId } of dormantUserIds) {
      const user = await User.findById(userId);
      if (!user) continue;
      const template = templates.DORMANT_USER_WINBACK;
      await sendSms(user, 'DORMANT_USER_WINBACK', template.sms(user.name));
    }
  },
  { connection }
);

worker.on('failed', (job, err) => {
  console.error(`Re-engagement job ${job.id} failed:`, err.message);
});

module.exports = { reEngagementQueue, scheduleDaily };

// Call scheduleDaily() once on app startup (e.g. in your main server file,
// alongside wherever you already start other BullMQ workers) to register
// the repeating job.