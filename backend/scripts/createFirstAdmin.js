// scripts/createFirstAdmin.js
//
// One-time bootstrap: creates the very first admin account so someone can
// then use PATCH /api/admin/users/:id/promote for everyone after that.
// This is a CLI script, NOT an HTTP route — never expose this as an endpoint,
// or anyone could self-promote to admin over the network.
//
// Usage:
//   node scripts/createFirstAdmin.js "Admin Name" admin@example.com 08012345678 "StrongPassword123"
//
// Safe to re-run: if the email already exists, it just promotes that
// existing user to admin instead of creating a duplicate.

require("dotenv").config()
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const connectDB = require("../config/db")
const User = require("../models/User")

async function run() {
  const [, , name, email, phone, password] = process.argv

  if (!name || !email || !phone || !password) {
    console.error(
      'Usage: node scripts/createFirstAdmin.js "Name" email@example.com 08012345678 "Password123"'
    )
    process.exit(1)
  }

  await connectDB()

  let user = await User.findOne({ email })

  if (user) {
    user.role = "admin"
    user.isVerified = true
    await user.save()
    console.log(`✅ Existing user ${email} promoted to admin.`)
  } else {
    const hashedPassword = await bcrypt.hash(password, 10)
    user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "admin",
      isVerified: true // skip OTP for the bootstrap admin
    })
    console.log(`✅ Admin account created for ${email}.`)
  }

  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error("❌ Failed to create first admin:", err.message)
  process.exit(1)
})