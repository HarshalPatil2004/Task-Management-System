import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { authCookieName, authCookieOptions, clearAuthCookieOptions } from "../config/auth.js"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRounds = 12
const tokenLifetime = "7d"

const publicUser = (user) => ({
  userId: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
})

export const register = async (req, res, next) => {
  const { name, email, password } = req.body
  const normalizedName = typeof name === "string" ? name.trim() : ""
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

  if (!normalizedName || !emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ message: "Enter your name and a valid email address." })
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({ message: "Password must be 8 or more characters and no more than 72 UTF-8 bytes." })
  }

  try {
    const passwordHash = await bcrypt.hash(password, passwordRounds)
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: "MEMBER",
    })

    return res.status(201).json({
      message: "Account created. Sign in to continue.",
      user: publicUser(user),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." })
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Please check your registration details." })
    }
    return next(error)
  }
}

export const login = async (req, res, next) => {
  const { email, password } = req.body
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

  if (!emailPattern.test(normalizedEmail) || typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Enter a valid email and password." })
  }
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
    return next(new Error("JWT_SECRET must be set to a unique secret of at least 32 bytes"))
  }

  try {
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash")
    if (
      !user ||
      typeof user.passwordHash !== "string" ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({ message: "Email or password is incorrect." })
    }
    if (!user.isActive) {
      return res.status(423).json({ message: "This account is locked." })
    }

    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: tokenLifetime,
    })
    res.cookie(authCookieName, token, authCookieOptions())

    return res.status(200).json({
      message: "Signed in successfully.",
      user: publicUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

export const logout = (req, res) => {
  res.clearCookie(authCookieName, clearAuthCookieOptions())
  return res.status(200).json({ message: "Signed out successfully." })
}

export const getCurrentUser = (req, res) => {
  return res.status(200).json({
    user: {
      userId: req.user.userId.toString(),
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  })
}
