export const authCookieName = "taskify_session"

export const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
})

export const clearAuthCookieOptions = () => {
  const { maxAge, ...options } = authCookieOptions()
  return options
}
