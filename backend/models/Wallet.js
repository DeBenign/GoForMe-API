const mongoose = require("mongoose")
 
const walletSchema = new mongoose.Schema(
  {
    user_id: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : "User",
      required: [true, "User ID is required"],
      unique  : true
    },
 
    balance: {
      type   : Number,
      default: 0,           // FIX: keep 0 as true default
      min    : [0, "Balance cannot go below 0"]
    },
 
    currency: {
      type   : String,
      default: "NGN"
    },
 
    transactions: [
      {
        amount: {
          type    : Number,
          required: true
        },
        type: {
          type    : String,
          enum    : ["credit", "debit"],
          required: true
        },
        reason: {
          type   : String,
          default: ""
        },
        // FIX: needed so we can dedupe — the same Paystack reference can arrive
        // twice (once via the browser redirect calling /wallet/verify, once via
        // the webhook), and we must only credit the wallet once per reference.
        reference: {
          type   : String,
          default: null
        },
        createdAt: {
          type   : Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
)
 
module.exports = mongoose.model("Wallet", walletSchema)