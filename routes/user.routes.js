// ── routes/user.routes.js ─────────────────────────────
const express   = require("express")
const router    = express.Router()
const protect   = require("../middleware/auth.middleware")
const authorize = require("../middleware/role.middleware")
const {
  getUsers, getUser, createUser, updateUser, deleteUser
} = require("../controllers/user.controller")
 
router.post("/",    createUser)                            // Public — registration fallback
router.get("/",     protect, authorize(["admin"]), getUsers) // FIX: was unprotected — any logged-in user could list all users
router.get("/:id",  protect, getUser)
router.patch("/:id",protect, updateUser)
router.delete("/:id", protect, authorize(["admin"]), deleteUser)
 
module.exports = router