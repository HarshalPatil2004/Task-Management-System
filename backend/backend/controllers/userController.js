import bcrypt from "bcrypt"
import mongoose from "mongoose"
import User from "../models/User.js"

const publicUser = (user) => ({
  userId: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
})

const createUser = async (req, res, next) => {
  const { name, email, password, role } = req.body
  const normalizedName = typeof name === "string" ? name.trim() : ""
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

  if (
    !normalizedName ||
    !normalizedEmail ||
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({ message: "Enter a name, email, and password with 8 or more characters and no more than 72 UTF-8 bytes." })
  }

  try {
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role,
    })
    return res.status(201).json({
      message: "Team member created successfully",
      data: publicUser(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." })
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Please check the user details." })
    }
    return next(error)
  }
}

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select("-__v")
    return res.status(200).json({
      count: users.length,
      data: users.map(publicUser),
    })
  } catch (error) {
    return next(error)
  }
}

const getUserById = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid user ID." })
  }
  if (req.user.role !== "ADMIN" && req.user.userId.toString() !== req.params.id) {
    return res.status(403).json({ message: "You cannot access another user's account." })
  }

  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    return res.status(200).json({ data: publicUser(user) })
  } catch (error) {
    return next(error)
  }
}

export { createUser, getUsers, getUserById }
