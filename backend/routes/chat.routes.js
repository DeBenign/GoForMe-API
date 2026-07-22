const express  = require("express")
const router   = express.Router()
const protect  = require("../middleware/auth.middleware")
const {
  getChatHistory,
  sendMessage,
  getUnreadCount,
  deleteMessage
} = require("../controllers/chat.controller")

// Specific routes BEFORE param routes
router.delete("/message/:messageId", protect, deleteMessage)   // delete a message
// Order-scoped routes
router.get("/:orderId/unread",       protect, getUnreadCount)  // unread count
router.get("/:orderId",              protect, getChatHistory)   // full chat history
router.post("/:orderId",             protect, sendMessage)      // REST fallback send

module.exports = router