// Centralized error handling utility
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log error
  console.error(`Error ${err.statusCode || 500}: ${err.message}`);

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = 'Resource not found';
    err = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const message = 'Duplicate field value entered';
    err = new AppError(message, 400);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message);
    err = new AppError(message, 400);
  }

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// AI API Error Handler
export const handleAIError = (error, context = 'AI operation') => {
  console.error(`${context} failed:`, error);
  
  if (error.message?.includes('API key')) {
    throw new AppError('AI service configuration error', 500);
  }
  
  if (error.message?.includes('quota')) {
    throw new AppError('AI service quota exceeded', 429);
  }
  
  if (error.message?.includes('timeout')) {
    throw new AppError('AI service timeout', 408);
  }
  
  throw new AppError(`AI ${context} failed`, 500);
};
