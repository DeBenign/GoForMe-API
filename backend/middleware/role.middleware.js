// ── middleware/role.middleware.js ─────────────────────
// FIX: added null check on req.user — if protect didn't run before authorize,
// req.user.role would throw "Cannot read property 'role' of undefined"
 
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" })
    }
 
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(" or ")}`
      })
    }
 
    next()
  }
}
 
module.exports = authorize