// middleware/error.middleware.js
// FIX: this file existed but was empty and never wired into server.js —
// any unhandled error (including Multer upload errors) fell through to
// Express's default HTML error response instead of clean JSON.
const multer = require("multer")

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be smaller than 5MB"
        : err.message
    return res.status(400).json({ success: false, message })
  }

  // Errors thrown by upload.middleware.js's fileFilter (e.g. wrong mimetype)
  // arrive here as plain Errors, not MulterError instances.
  if (err.message && err.message.includes("Only JPEG, PNG, or WebP")) {
    return res.status(400).json({ success: false, message: err.message })
  }

  console.error("Unhandled error:", err)
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong"
  })
}

module.exports = errorHandler