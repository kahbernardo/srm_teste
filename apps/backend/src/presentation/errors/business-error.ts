import { AppError } from './app-error';

/**
 * Error for business logic violations (400 Bad Request)
 * Examples: trying to settle already settled transaction, invalid state transitions
 */
export class BusinessError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'BusinessError';
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}
