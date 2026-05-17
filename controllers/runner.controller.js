// controllers/runner.controller.js
const Runner = require("../models/Runner")
const User = require("../models/User")

// ── CREATE RUNNER (apply) ─────────────────────────────
const createRunner = async (req, res) => {
  try {
    const { user_id, skills, location, address, documents } = req.body

    if (!user_id || !location) {
      return res.status(400).json({
        success: false,
        message: "User ID and location are required"
      })
    }

    const existing = await Runner.findOne({ user_id })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Runner profile already exists for this user"
      })
    }

    const runner = await Runner.create({
      user_id,
      skills,
      location,
      address,
      documents,
      status: "pending"
    })

    // Upgrade user role to runner
    await User.findByIdAndUpdate(user_id, { role: "runner" })

    return res.status(201).json({
      success: true,
      message: "Runner application submitted. Awaiting admin approval.",
      data: runner
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to apply as runner",
      error: error.message
    })
  }
}

// ── GET ALL RUNNERS ───────────────────────────────────
const getRunners = async (req, res) => {
  try {
    const runners = await Runner.find().populate("user_id", "name email phone")

    return res.status(200).json({
      success: true,
      count: runners.length,
      data: runners
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch runners",
      error: error.message
    })
  }
}

// ── GET SINGLE RUNNER ─────────────────────────────────
const getRunner = async (req, res) => {
  try {
    const runner = await Runner.findById(req.params.id).populate("user_id", "name email phone")

    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner not found" })
    }

    return res.status(200).json({ success: true, data: runner })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching runner",
      error: error.message
    })
  }
}

// ── UPDATE RUNNER PROFILE ─────────────────────────────
const updateRunner = async (req, res) => {
  try {
    // FIX: was passing {updateRunner} (the function itself!) as the update
    // Correct: pass req.body as the update data
    const runner = await Runner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner not found" })
    }

    return res.status(200).json({ success: true, data: runner })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating runner",
      error: error.message
    })
  }
}

// ── UPDATE AVAILABILITY (admin/direct) ───────────────
const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be true or false"
      })
    }

    const runner = await Runner.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    )

    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner not found" })
    }

    return res.json({ success: true, data: runner })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update availability",
      error: error.message
    })
  }
}

// ── TOGGLE AVAILABILITY (runner toggles own status) ──
const toggleAvailability = async (req, res) => {
  try {
    const runner = await Runner.findOne({ user_id: req.user._id })

    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner not found" })
    }

    if (runner.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Your account must be approved before going online"
      })
    }

    runner.isAvailable = !runner.isAvailable
    await runner.save()

    return res.json({
      success: true,
      message: `Runner is now ${runner.isAvailable ? "ONLINE 🟢" : "OFFLINE 🔴"}`,
      data: runner
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to toggle availability",
      error: error.message
    })
  }
}

// ── UPDATE LOCATION (REST fallback if socket fails) ──
const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "lat and lng are required" })
    }

    const runner = await Runner.findOne({ user_id: req.user._id })

    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner not found" })
    }

    runner.location = { lat, lng }
    await runner.save()

    return res.json({ success: true, data: runner.location })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update location",
      error: error.message
    })
  }
}

// ── DELETE RUNNER ─────────────────────────────────────
const deleteRunner = async (req, res) => {
  try {
    const runner = await Runner.findByIdAndDelete(req.params.id)

    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner not found" })
    }

    return res.json({ success: true, message: "Runner deleted successfully" })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete runner",
      error: error.message
    })
  }
}

module.exports = {
  createRunner,
  getRunners,
  getRunner,
  updateRunner,
  updateAvailability,
  toggleAvailability,
  updateLocation,
  deleteRunner
}