const { Queue, Worker } = require('bullmq');
const User = require('../models/User');
const Order = require('../models/Order');
const templates = require('./templates');
const { sendSms } = require('./smsSender');
const connection = require('../config/redis');

const QUEUE_NAME = 'cart-abandoned';
const cartAbandonedQueue = new Queue(QUEUE_NAME, { connection });

const ABANDON_DELAY_MS = 15 * 60 * 1000; // 15 min — tune based on typical payment completion time

/**
 * Call this from your existing createOrder() controller, right after an
 * order is created in a pending/unpaid state. Schedules a delayed check;
 * if the order is still unpaid when the delay elapses, sends the nudge.
 */
async function scheduleAbandonedCheck(orderId) {
  await cartAbandonedQueue.add(
    'check-abandoned',
    { orderId },
    { delay: ABANDON_DELAY_MS, jobId: `abandoned-${orderId}` }
  );
}

/**
 * Call this from wherever payment success is confirmed (webhook or
 * completeOrder), so a completed order doesn't get a "you forgot" text.
 */
async function cancelAbandonedCheck(orderId) {
  const job = await cartAbandonedQueue.getJob(`abandoned-${orderId}`);
  if (job) await job.remove();
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { orderId } = job.data;
    const order = await Order.findById(orderId);
    if (!order || order.status !== 'pending') return; // already paid, cancelled, or gone

    const user = await User.findById(order.customer);
    if (!user) return;

    const template = templates.CART_ABANDONED;
    await sendSms(user, 'CART_ABANDONED', template.sms(user.name));
  },
  { connection }
);

worker.on('failed', (job, err) => {
  console.error(`Cart-abandoned job ${job.id} failed:`, err.message);
});

module.exports = { scheduleAbandonedCheck, cancelAbandonedCheck };