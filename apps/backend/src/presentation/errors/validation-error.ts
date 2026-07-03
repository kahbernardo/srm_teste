import { AppError } from './app-error';

/**
 * Error for validation failures (400 Bad Request)
 */
export class ValidationError extends AppError {
  public readonly details?: any;

  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
