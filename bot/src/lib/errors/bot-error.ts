export enum BotErrorCode {
  BadRequestError = 'BadRequest',
  UnauthorizedError = 'UnauthorizedError',
  ForbiddenError = 'ForbiddenError',
  NotFoundError = 'NotFoundError',
  InfrastructureError = 'InfrastructureError',
  UnknownError = 'UnknownError',
}

export enum BotErrorType {
  InvalidConfigError = 'InvalidConfigError',
  InvalidInputError = 'InvalidInputError',
  InvalidSignatureError = 'InvalidSignatureError',
  GenericBadRequestError = 'BadRequest',
  GenericUnauthorizedError = 'UnauthorizedError',
  GenericForbiddenError = 'ForbiddenError',
  GenericNotFoundError = 'NotFoundError',
  InfrastructureError = 'InfrastructureError',
  UnknownError = 'UnknownError',
  CommandNotFoundError = 'CommandNotFoundError',
  RandomRedditPostNotFoundError = 'RedditPostNotFoundError',
}

interface ErrorAttributes {
  errorCode: BotErrorCode;
  message: string;
  isRetryable?: boolean;
}

export const botErrorParameters: Record<BotErrorType, ErrorAttributes> = {
  [BotErrorType.InvalidConfigError]: {
    errorCode: BotErrorCode.BadRequestError,
    message: 'Invalid configuration',
  },
  [BotErrorType.InvalidInputError]: {
    errorCode: BotErrorCode.BadRequestError,
    message: 'Invalid input',
  },
  [BotErrorType.InvalidSignatureError]: {
    errorCode: BotErrorCode.UnauthorizedError,
    message: 'Invalid signature',
  },
  [BotErrorType.GenericBadRequestError]: {
    errorCode: BotErrorCode.BadRequestError,
    message: 'Bad request',
  },
  [BotErrorType.GenericUnauthorizedError]: {
    errorCode: BotErrorCode.UnauthorizedError,
    message: 'Unauthorized',
  },
  [BotErrorType.GenericForbiddenError]: {
    errorCode: BotErrorCode.ForbiddenError,
    message: 'Forbidden',
  },
  [BotErrorType.GenericNotFoundError]: {
    errorCode: BotErrorCode.NotFoundError,
    message: 'Resource not found',
  },
  [BotErrorType.InfrastructureError]: {
    errorCode: BotErrorCode.InfrastructureError,
    message: 'Infrastructure error',
  },
  [BotErrorType.UnknownError]: {
    errorCode: BotErrorCode.UnauthorizedError,
    message: 'Unknown error',
  },
  [BotErrorType.CommandNotFoundError]: {
    errorCode: BotErrorCode.NotFoundError,
    message: 'Unsupported command',
  },
  [BotErrorType.RandomRedditPostNotFoundError]: {
    errorCode: BotErrorCode.NotFoundError,
    message: 'Random reddit post not found',
    isRetryable: true,
  },
};

interface BotErrorParams {
  logDetails?: unknown;
  responseDetails?: unknown;
}

export class BotError extends Error {
  errorCode: BotErrorCode;
  errorType: BotErrorType;
  isRetryable: boolean;
  logDetails?: unknown;
  responseDetails?: unknown;

  constructor(errorType: BotErrorType, params?: BotErrorParams) {
    const errorDetails = botErrorParameters[errorType];

    super(errorDetails.message);

    this.errorCode = errorDetails.errorCode;
    this.errorType = errorType;
    this.isRetryable = errorDetails.isRetryable ?? false;

    this.logDetails = params?.logDetails;
    this.responseDetails = params?.responseDetails;
  }

  public getStatusCode() {
    switch (this.errorCode) {
      case BotErrorCode.BadRequestError:
        return 400;
      case BotErrorCode.UnauthorizedError:
        return 401;
      case BotErrorCode.ForbiddenError:
        return 403;
      case BotErrorCode.NotFoundError:
        return 404;
      case BotErrorCode.InfrastructureError:
      case BotErrorCode.UnknownError:
        return 500;
    }
  }
}
