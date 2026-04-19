// ── middleware/auth.middleware.js ─────────────────────
const jwt  = require("../utils/jwt")
const User = require("../models/User")
 
const protect = async (req, res, next) => {
  try {
    let token
 
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }
 
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token" })
    }
 
    // FIX: socket.js uses jwt.verify — keep naming consistent across the app
    // Check your utils/jwt.js and make sure the export is named "verifyToken"
    // or rename both usages to match
    const decoded = jwt.verifyToken(token)
 
    // FIX: no null check — if user was deleted after token was issued,
    // findById returns null and req.user = null, then next() runs with a null user
    // causing crashes in every downstream controller
    const user = await User.findById(decoded.id).select("-password -otp -refreshToken")
 
    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" })
    }
 
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account has been deactivated" })
    }
 
    req.user = user
    next()
 
  } catch (error) {
    return res.status(401).json({ success: false, message: "Not authorized, token failed" })
  }
}
 
module.exports = protect