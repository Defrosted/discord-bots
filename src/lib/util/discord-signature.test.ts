import { describe, expect, test } from 'vitest';
import * as nacl from 'tweetnacl';
import {
  makeDiscordSignatureVerifier,
  validateSignatureVerifierParams,
  apiGwEventtoSignatureParams,
} from './discord-signature';
import { BotError, BotErrorType } from '@lib/errors/bot-error';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

const keyPair = nacl.sign.keyPair();
const publicKey = Buffer.from(keyPair.publicKey).toString('hex');

const signMessage = (timestamp: string, body: string) => {
  const message = Buffer.from(timestamp + body);
  return Buffer.from(nacl.sign.detached(message, keyPair.secretKey)).toString('hex');
};

const makeEvent = (headers: Record<string, string>, body?: string) =>
  ({ headers, body, isBase64Encoded: false }) as unknown as APIGatewayProxyEventV2;

describe('makeDiscordSignatureVerifier', () => {
  const verifier = makeDiscordSignatureVerifier({ discordPublicKey: publicKey });

  test('does not throw for a valid signature', () => {
    const timestamp = '1234567890';
    const body = '{"type":1}';
    const signature = signMessage(timestamp, body);
    expect(() => verifier({ timestamp, body, signature })).not.toThrow();
  });

  test('throws InvalidSignatureError when signature is wrong', () => {
    expect(() =>
      verifier({ timestamp: '123', body: 'body', signature: 'a'.repeat(128) }),
    ).toThrow(expect.objectContaining({ errorType: BotErrorType.InvalidSignatureError }));
  });

  test('throws InvalidSignatureError when message has been tampered with', () => {
    const timestamp = '1234567890';
    const signature = signMessage(timestamp, 'original body');
    expect(() =>
      verifier({ timestamp, body: 'tampered body', signature }),
    ).toThrow(expect.objectContaining({ errorType: BotErrorType.InvalidSignatureError }));
  });

  test('throws InvalidSignatureError for wrong public key', () => {
    const differentKeyPair = nacl.sign.keyPair();
    const wrongPublicKey = Buffer.from(differentKeyPair.publicKey).toString('hex');
    const differentVerifier = makeDiscordSignatureVerifier({ discordPublicKey: wrongPublicKey });

    const timestamp = '1234567890';
    const body = '{"type":1}';
    const signature = signMessage(timestamp, body);

    expect(() => differentVerifier({ timestamp, body, signature })).toThrow(
      expect.objectContaining({ errorType: BotErrorType.InvalidSignatureError }),
    );
  });
});

describe('validateSignatureVerifierParams', () => {
  test('returns valid params when all required fields are present', () => {
    const params = { signature: 'abc', timestamp: '123', body: 'test' };
    expect(validateSignatureVerifierParams(params)).toEqual(params);
  });

  test('succeeds when body is omitted (it is optional)', () => {
    const params = { signature: 'abc', timestamp: '123' };
    expect(validateSignatureVerifierParams(params)).toMatchObject({ signature: 'abc', timestamp: '123' });
  });

  test('throws BotError with InvalidSignatureError when signature is missing', () => {
    expect(() => validateSignatureVerifierParams({ timestamp: '123' })).toThrow(
      expect.objectContaining({ errorType: BotErrorType.InvalidSignatureError }),
    );
  });

  test('throws BotError with InvalidSignatureError when timestamp is missing', () => {
    expect(() => validateSignatureVerifierParams({ signature: 'abc' })).toThrow(
      expect.objectContaining({ errorType: BotErrorType.InvalidSignatureError }),
    );
  });
});

describe('apiGwEventtoSignatureParams', () => {
  test('extracts signature and timestamp from lowercase headers', () => {
    const result = apiGwEventtoSignatureParams(
      makeEvent(
        { 'x-signature-ed25519': 'sig123', 'x-signature-timestamp': 'ts123' },
        'body',
      ),
    );
    expect(result.signature).toBe('sig123');
    expect(result.timestamp).toBe('ts123');
    expect(result.body).toBe('body');
  });

  test('extracts signature and timestamp from mixed-case headers', () => {
    const result = apiGwEventtoSignatureParams(
      makeEvent(
        { 'X-Signature-Ed25519': 'sig456', 'X-Signature-Timestamp': 'ts456' },
        'body2',
      ),
    );
    expect(result.signature).toBe('sig456');
    expect(result.timestamp).toBe('ts456');
  });

  test('throws when signature header is missing', () => {
    expect(() =>
      apiGwEventtoSignatureParams(makeEvent({ 'x-signature-timestamp': 'ts123' }, 'body')),
    ).toThrow(BotError);
  });
});
