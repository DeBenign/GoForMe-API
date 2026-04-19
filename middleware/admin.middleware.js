// ── middleware/admin.middleware.js ────────────────────
// FIX: adminAuth checks req.user.role but req.user is only set by protect.
// Admin routes were calling adminAuth WITHOUT protect running first,
// so req.user was always undefined → every admin route always returned 403.
// Solution: adminAuth now calls protect internally before checking the role.
 
const protectMiddleware = require("./auth.middleware") // reuse protect
 
const adminAuth = (req, res, next) => {
  // First run protect to decode token and attach req.user
  protectMiddleware(req, res, () => {
    // Then check the role
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden: Admins only" })
    }
    next()
  })
}
 
module.exports = adminAuth