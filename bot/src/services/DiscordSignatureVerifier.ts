import * as nacl from 'tweetnacl';
import { BadRequestError, UnauthorizedError } from '@domain/HttpErrorTypes';
import { SignatureVerificationPort, VerificationError } from '@ports/SignatureVerificationPort';

export class DiscordSignatureVerificationService implements SignatureVerificationPort {
  constructor(private publicKey: string) {}

  public async verify (
    signature?: string, 
    timestamp?: string, 
    body?: string
  ): Promise<void> {
    if(!signature || !timestamp)
      throw new BadRequestError(VerificationError.MISSING_SIGNATURE_TIMESTAMP);

    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, 'hex'),
      Buffer.from(this.publicKey, 'hex')
    );

    if(!isVerified)
      throw new UnauthorizedError(VerificationError.INVALID_SIGNATURE);
  }
}
