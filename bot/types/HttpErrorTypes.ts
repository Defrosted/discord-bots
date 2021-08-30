import { CustomError } from "ts-custom-error"

export class HttpRequestError extends CustomError {
  constructor (public code: number, message?: string) {
    super(message)
  }
}

export class NotFoundError extends HttpRequestError {
  constructor(message?: string) {
    super(404, message)
  }
}

export class UnauthorizedError extends HttpRequestError {
  constructor(message?: string) {
    super(401, message)
  }
}

export class ForbiddenError extends HttpRequestError {
  constructor(message?: string) {
    super(403, message)
  }
}

export class BadRequestError extends HttpRequestError {
  constructor(message?: string) {
    super(400, message)
  }
}
