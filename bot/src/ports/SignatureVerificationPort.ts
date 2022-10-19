export interface SignatureVerificationPort {
  verify(signature?: string, timestamp?: string, body?: string): Promise<void>;
}

export enum VerificationError {
  MISSING_SIGNATURE_TIMESTAMP = 'Missing signature or timestamp',
  INVALID_SIGNATURE = 'Invalid request signature'
}
