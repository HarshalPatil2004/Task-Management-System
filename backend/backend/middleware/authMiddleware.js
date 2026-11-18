import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { authCookieName, clearAuthCookieOptions } from "../config/auth.js"

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.[authCookieName]
  if (!token) {
    return res.status(401).json({ message: "Authentication required" })
  }

  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
    return next(new Error("JWT_SECRET must be set to a unique secret of at least 32 bytes"))
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      res.clearCookie(authCookieName, clearAuthCookieOptions())
      return res.status(401).json({ message: "Session expired. Please sign in again." })
    }
    return next(error)
  }

  if (!payload || typeof payload !== "object" || !payload.sub) {
    res.clearCookie(authCookieName, clearAuthCookieOptions())
    return res.status(401).json({ message: "Invalid session" })
  }

  try {
    const user = await User.findById(payload.sub).select("name email role isActive")
    if (!user || !user.isActive) {
      res.clearCookie(authCookieName, clearAuthCookieOptions())
      return res.status(401).json({ message: "Your account is unavailable" })
    }

    req.user = {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You do not have permission to access this resource" })
  }
  return next()
}
