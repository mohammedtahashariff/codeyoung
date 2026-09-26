/**
 * Centralized safe error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log server errors internally without exposing secrets
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  if (statusCode >= 500) {
    console.error("[ServerError]", {
      message: err.message,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  const safeMessage = statusCode >= 500
    ? "An unexpected internal server error occurred. Please try again later."
    : err.message || "An error occurred while processing your request.";

  res.status(statusCode).json({
    success: false,
    message: safeMessage,
    error: safeMessage,
    ...(err.details ? { details: err.details } : {}),
  });
};
