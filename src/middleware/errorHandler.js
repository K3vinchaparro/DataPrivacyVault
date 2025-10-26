/**
 * Global error handler middleware
 * Handles all unhandled errors and provides consistent error responses
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging (in production, use proper logging service)
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorDetails = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation error';
    errorDetails = err.details;
  } else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    statusCode = 400;
    errorMessage = 'Invalid JSON format';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorMessage = 'Request entity too large';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    errorMessage = 'Unexpected field in request';
  }

  // Prepare error response
  const errorResponse = {
    error: errorMessage,
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  };

  // Add error details if available and in development mode
  if (errorDetails && process.env.NODE_ENV === 'development') {
    errorResponse.details = errorDetails;
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper to catch async errors in route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function that catches async errors
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  asyncErrorHandler
};
