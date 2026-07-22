/**
 * Central place for re-engagement message copy, so marketing/product can
 * tweak wording without touching job logic. Keep messages short — SMS
 * segments cost money past 160 chars, and push notifications truncate.
 */

const templates = {
  REPEAT_ERRAND_NUDGE: {
    sms: (name, lastService) =>
      `Hi ${name}, need your usual ${lastService} run today? Reply YES or open GoForMe to book in seconds.`,
    push: {
      title: 'Time for your usual errand?',
      body: (lastService) => `Book your ${lastService} run in one tap.`,
    },
  },
  CART_ABANDONED: {
    sms: (name) =>
      `Hi ${name}, you started an errand on GoForMe but didn't finish booking. Complete it now before your runner slot fills up.`,
    push: {
      title: 'Finish your errand booking',
      body: () => `You're one step away — complete your booking now.`,
    },
  },
  DORMANT_USER_WINBACK: {
    sms: (name) =>
      `We miss you, ${name}! It's been a while — here's ₦500 off your next GoForMe errand. Use code WELCOMEBACK.`,
    push: {
      title: 'We miss you',
      body: () => `₦500 off your next errand — code WELCOMEBACK.`,
    },
  },
  RUNNER_LOW_ACTIVITY: {
    sms: (name) =>
      `Hi ${name}, there are errands near you waiting for a runner. Open GoForMe to go online and start earning.`,
    push: {
      title: 'Errands waiting near you',
      body: () => `Go online now to pick up nearby errands.`,
    },
  },
};

module.exports = templates;