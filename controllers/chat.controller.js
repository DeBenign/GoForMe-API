// controllers/chat.controller.js
// Week 6 — Chat History API
const Message = require("../models/Message")
const Order   = require("../models/Order")

// ─────────────────────────────────────────────────────
//  @route   GET /api/v1/chat/:orderId
//  @desc    Get full chat history for an order
//  @access  Private — Customer or Runner involved in order
// ─────────────────────────────────────────────────────
const getChatHistory = async (req, res) => {
  try {
    const { orderId } = req.params

    // Verify the order exists
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    // Only the customer or assigned runner can view the chat
    const isCustomer = order.user_id.toString() === req.user._id.toString()
    const isAdmin    = req.user.role === "admin"

    // Check if user is the runner on this order
    let isRunner = false
    if (req.user.role === "runner") {
      const Runner = require("../models/Runner")
      const runner = await Runner.findOne({ user_id: req.user._id })
      isRunner = runner && order.runner_id?.toString() === runner._id.toString()
    }

    if (!isCustomer && !isRunner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not part of this order."
      })
    }

    const messages = await Message.find({ order_id: orderId })
      .sort({ createdAt: 1 }) // oldest first — natural chat order
      .populate("sender_id",   "name avatar")
      .populate("receiver_id", "name avatar")

    return res.json({
      success: true,
      count  : messages.length,
      data   : messages
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   POST /api/v1/chat/:orderId
//  @desc    Send a message (REST fallback — primary is Socket.IO)
//  @access  Private — Customer or Runner involved in order
// ─────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { orderId }             = req.params
    const { content, receiverId } = req.body

    if (!content || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "Content and receiverId are required"
      })
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    if (!["accepted", "in_progress"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Chat is only available for active orders"
      })
    }

    const message = await Message.create({
      sender_id  : req.user._id,
      receiver_id: receiverId,
      order_id   : orderId,
      content
    })

    await message.populate("sender_id",   "name")
    await message.populate("receiver_id", "name")

    // Also broadcast via Socket.IO if available
    try {
      const { getIO } = require("../config/socket")
      const io = getIO()
      io.to(`order_${orderId}`).emit("chat:receive", message)
    } catch (_) {
      // Socket not available — REST response is enough
    }

    return res.status(201).json({ success: true, data: message })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   PATCH /api/v1/chat/:orderId/read
//  @desc    Mark all messages in an order as read
//  @access  Private
// ─────────────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const { orderId } = req.params

    await Message.updateMany(
      { order_id: orderId, receiver_id: req.user._id, isRead: false },
      { isRead: true }
    )

    return res.json({ success: true, message: "Messages marked as read" })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   GET /api/v1/chat/:orderId/unread
//  @desc    Get unread message count for an order
//  @access  Private
// ─────────────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const { orderId } = req.params

    const count = await Message.countDocuments({
      order_id   : orderId,
      receiver_id: req.user._id,
      isRead     : false
    })

    return res.json({ success: true, unreadCount: count })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error  : error.message
    })
  }
}

// ─────────────────────────────────────────────────────
//  @route   DELETE /api/v1/chat/:orderId
//  @desc    Delete a message (REST fallback — primary is Socket.IO)
//  @access  Private — Customer or Runner involved in order
// ─────────────────────────────────────────────────────
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id)

    if (!message) {
      return res.status(404).json({ message: "Message not found" })
    }

    res.json({ success: true, message: "Message deleted" })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { getChatHistory, sendMessage, markAsRead, getUnreadCount, deleteMessage }