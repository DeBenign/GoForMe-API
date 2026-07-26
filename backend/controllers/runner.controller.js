// controllers/runner.controller.js
const Runner = require("../models/Runner")
const User = require("../models/User")
const cloudinary = require("../config/cloudinary")

// ── UPLOAD ID PHOTO / SELFIE ──────────────────────────
// multipart/form-data, field name "image", plus a "type" field of
// "id_image" or "selfie" to say which slot it fills. Only the runner
// themself can upload onto their own profile — resolved via req.user._id,
// never a runner id passed by the client, so one applicant can't overwrite
// another's documents.
const uploadDocument = async (req, res) => {
  try {
    const { type } = req.body

    if (!["id_image", "selfie"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type must be "id_image" or "selfie"'
      })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" })
    }

    const runner = await Runner.findOne({ user_id: req.user._id })
    if (!runner) {
      return res.status(404).json({ success: false, message: "Runner profile not found" })
    }

    // Stream the in-memory buffer straight to Cloudinary — no temp file on disk.
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `goforme/runner-documents/${runner._id}`,
          resource_type: "image"
        },
        (error, result) => (error ? reject(error) : resolve(result))
      )
      stream.end(req.file.buffer)
    })

    runner.documents[type] = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id
    }
    await runner.save()

    return res.json({
      success: true,
      message: `${type === "id_image" ? "ID photo" : "Selfie"} uploaded`,
      data: runner.documents[type]
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload document",
      error: error.message
    })
  }
}

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

    // NOTE: role stays "customer" until admin approval — see admin.controller.js
    // approveRunner(), which is now where the role flip happens. Flipping it
    // here (before any vetting) let an unapproved applicant carry the
    // "runner" role immediately.

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
// ── GET MY OWN RUNNER PROFILE ──────────────────────────
const getMyRunnerProfile = async (req, res) => {
  try {
    const runner = await Runner.findOne({ user_id: req.user._id }).populate("user_id", "name email phone")

    if (!runner) {
      return res.status(404).json({ success: false, message: "No runner profile found for this account" })
    }

    return res.status(200).json({ success: true, data: runner })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching your runner profile",
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

    // FIX: this had no access restriction at all — any authenticated user
    // (found while building the admin runner-detail view, which reads bank
    // details and ID document images from this exact endpoint) could fetch
    // ANY runner's bank account number and ID/selfie images just by
    // guessing/incrementing an id, since customer_frontend legitimately
    // calls this to show the assigned runner's name/rating during an
    // active order. Only admins and the runner themselves should see the
    // sensitive fields; everyone else gets the public-safe subset.
    const isAdmin = req.user.role === "admin"
    const isSelf = runner.user_id?._id?.toString() === req.user._id.toString()

    if (isAdmin || isSelf) {
      return res.status(200).json({ success: true, data: runner })
    }

    const publicRunner = {
      _id: runner._id,
      user_id: runner.user_id,
      rating: runner.rating,
      totalRatings: runner.totalRatings,
      completedJobs: runner.completedJobs,
      isAvailable: runner.isAvailable,
      status: runner.status
    }

    return res.status(200).json({ success: true, data: publicRunner })

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
  uploadDocument,
  getMyRunnerProfile,
  getRunners,
  getRunner,
  updateRunner,
  updateAvailability,
  toggleAvailability,
  updateLocation,
  deleteRunner
}