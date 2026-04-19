// ── utils/jwt.js ──────────────────────────────────────
// ✅ Clean — no changes needed
// Note: socket.js uses jwt.verify(token, secret) directly from jsonwebtoken
//       while protect middleware uses jwt.verifyToken(token) from this file
//       To keep consistent, update socket.js to use this util:
//       const jwtUtil = require("../utils/jwt"); jwtUtil.verifyToken(token)
 
const jwt = require("jsonwebtoken")
 
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  )
}
 
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}
 
module.exports = { generateToken, verifyToken }