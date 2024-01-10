import { makeDynamoDbClient } from './adapters/dynamodb-client';
import { makeHttpRequestClient } from './adapters/http-client';
import { makeLambdaClient } from './adapters/lambda-client';
import { makeOauthHttpClient } from './adapters/oauth-client';
import { makeSsmClient } from './adapters/ssm-client';
import { makeDiscordApiRepository } from './repositories/discord-api';
import { makeRedditApiRepository } from './repositories/reddit-api';
import {
  makeDiscordSignatureVerifier,
  makeVerifyApiGwEventDiscordSignature,
} from './util/discord-signature';
import { makeWithExponentialRetry } from './util/with-exponential-retry';

/* Adapters */
export const injectSsmClient = (config: { region: string }) =>
  makeSsmClient({
    region: config.region,
  });

export const injectDynamoDbClient = (config: { region: string }) =>
  makeDynamoDbClient({
    region: config.region,
  });

export const injectLambdaClient = (config: { region: string }) =>
  makeLambdaClient({
    region: config.region,
  });

export const injectHttpRequestClient = () =>
  makeHttpRequestClient({
    withExponentialRetry: injectWithExponentialRetry(),
  });
export const injectOauthHttpClient = (config: {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  userAgent?: string;
}) =>
  makeOauthHttpClient({
    httpRequestClient: injectHttpRequestClient(),
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authUrl: config.authUrl,
    userAgent: config.userAgent,
  });

export const injectDiscordApiRepository = (config: {
  discordApiUrl: string;
  applicationId: string;
  authToken: string;
}) =>
  makeDiscordApiRepository({
    httpRequestClient: injectHttpRequestClient(),
    discordApiUrl: config.discordApiUrl,
    applicationId: config.applicationId,
    authToken: config.authToken,
  });

export const injectRedditApiRepository = (config: {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  apiUrl: string;
  userAgent: string;
}) =>
  makeRedditApiRepository({
    oauthClient: injectOauthHttpClient(config),
    apiUrl: config.apiUrl,
  });

/* Utilities */
export const injectDiscordSignatureVerifier = (config: {
  discordPublicKey: string;
}) =>
  makeDiscordSignatureVerifier({
    discordPublicKey: config.discordPublicKey,
  });

export const injectVerifyApiGwEventDiscordSignature = (config: {
  discordPublicKey: string;
}) =>
  makeVerifyApiGwEventDiscordSignature({
    verifyDiscordSignature: injectDiscordSignatureVerifier(config),
  });

export const injectWithExponentialRetry = (params?: {
  maxRetries?: number;
  retryExponent?: number;
}) =>
  makeWithExponentialRetry({
    maxRetries: params?.maxRetries,
    retryExponent: params?.retryExponent,
  });
