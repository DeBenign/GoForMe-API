// models/Wallet.js
const mongoose = require("mongoose")

const walletSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true
    },

    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot go below 0"]
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Wallet", walletSchema)