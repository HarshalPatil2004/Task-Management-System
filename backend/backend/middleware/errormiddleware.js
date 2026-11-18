const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }

  const status = error.statusCode || error.status
  if (status === 400 || status === 413) {
    return res.status(status).json({
      message: status === 413 ? "Request body is too large." : "Invalid request body.",
    })
  }

  console.error("API error:", error)
  return res.status(500).json({ message: "Internal server error" })
}

export default errorMiddleware