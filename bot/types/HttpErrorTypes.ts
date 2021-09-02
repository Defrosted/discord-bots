export class HttpRequestError extends Error {
  constructor (public code: number, public message: string) {
    super(message)
    Object.setPrototypeOf(this, HttpRequestError.prototype)
  }
}

export class NotFoundError extends HttpRequestError {
  constructor(message: string) {
    super(404, message)
  }
}

export class UnauthorizedError extends HttpRequestError {
  constructor(message: string) {
    super(401, message)
  }
}

export class ForbiddenError extends HttpRequestError {
  constructor(message: string) {
    super(403, message)
  }
}

export class BadRequestError extends HttpRequestError {
  constructor(message: string) {
    super(400, message)
  }
}
