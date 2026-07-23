// middleware/upload.middleware.js
const multer = require("multer")

const storage = multer.memoryStorage() // buffer stays in memory, streamed straight to Cloudinary — no temp files on disk

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, or WebP images are allowed"))
  }
  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

module.exports = upload