import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as R from 'ramda';
import * as nacl from 'tweetnacl';
import { z } from 'zod';
import { parseApiGwBody } from './apigateway';
import { makeRecordValidator } from './record-validator';

interface Deps {
  discordPublicKey: string;
}

const signatureVerifierParamsSchema = z.object({
  signature: z.string(),
  timestamp: z.string(),
  body: z.string().optional(),
});

export type DiscordSignatureVerifierParams = z.infer<
  typeof signatureVerifierParamsSchema
>;

export const validateSignatureVerifierParams = (
  params: Partial<DiscordSignatureVerifierParams>,
) =>
  makeRecordValidator(
    signatureVerifierParamsSchema,
    BotErrorType.InvalidSignatureError,
  )(params);

export type DiscordSignatureVerifier = (
  params: DiscordSignatureVerifierParams,
) => void;

export const makeDiscordSignatureVerifier =
  (deps: Deps): DiscordSignatureVerifier =>
  (params) => {
    const { timestamp, body, signature } = params;
    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, 'hex'),
      Buffer.from(deps.discordPublicKey, 'hex'),
    );

    if (!isVerified) throw new BotError(BotErrorType.InvalidSignatureError);
  };

export const apiGwEventtoSignatureParams = (event: APIGatewayProxyEvent) =>
  validateSignatureVerifierParams({
    signature:
      event.headers['X-Signature-Ed25519'] ??
      event.headers['x-signature-ed25519'],
    timestamp:
      event.headers['X-Signature-Timestamp'] ??
      event.headers['x-signature-timestamp'],
    body: parseApiGwBody(event),
  });

export type VerifyApiGwEventDiscordSignature = (
  event: APIGatewayProxyEvent,
) => void;

export const makeVerifyApiGwEventDiscordSignature =
  (deps: {
    verifyDiscordSignature: DiscordSignatureVerifier;
  }): VerifyApiGwEventDiscordSignature =>
  (event) =>
    R.pipe(apiGwEventtoSignatureParams, deps.verifyDiscordSignature)(event);
