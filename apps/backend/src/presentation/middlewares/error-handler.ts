import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../errors';

interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  details?: any;
  stack?: string;
}

/**
 * Global error handler middleware for Fastify
 * Handles all errors thrown in the application and formats them consistently
 */
export async function errorHandler(
  error: Error | FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log the error
  request.log.error({
    err: error,
    url: request.url,
    method: request.method,
    correlationId: request.id,
  });

  // Default error response
  let statusCode = 500;
  let errorName = 'InternalServerError';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    errorName = 'ValidationError';
    message = 'Validation failed';
    details = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
  }
  // Handle custom AppError instances
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorName = error.name;
    message = error.message;

    // Include details if available (e.g., from ValidationError)
    if ('details' in error) {
      details = (error as any).details;
    }
  }
  // Handle Fastify errors
  else if ('statusCode' in error) {
    statusCode = (error as FastifyError).statusCode || 500;
    errorName = error.name;
    message = error.message;
  }
  // Handle unknown errors
  else {
    statusCode = 500;
    errorName = error.name || 'Error';
    message = error.message || 'An unexpected error occurred';
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: errorName,
    message,
    statusCode,
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Send response
  reply.status(statusCode).send(errorResponse);
}
