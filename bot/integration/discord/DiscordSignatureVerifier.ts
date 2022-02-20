import * as nacl from 'tweetnacl';
import { BadRequestError, UnauthorizedError } from '../../types/HttpErrorTypes';
import { SSMManager } from '../aws/SSMManager';

export enum VerificationError {
  MISSING_PUBLIC_KEY = 'Missing Discord public key',
  MISSING_SIGNATURE_TIMESTAMP = 'Missing signature or timestamp',
  INVALID_SIGNATURE = 'Invalid request signature'
}

export class DiscordSignatureVerifier {
  private publicKey?: string;
  public readonly ready: Promise<undefined>;

  constructor(publicKey?: string) {
    if(publicKey) {
      this.publicKey = publicKey;
      this.ready = Promise.resolve(undefined);
      return;
    }

    const { BOT_DISCORD_PUBLIC_KEY } = process.env;
      // Fetch public key from SSM
    this.ready = new Promise((resolve, reject) => {
      new SSMManager()
        .getParameterValue(BOT_DISCORD_PUBLIC_KEY)
        .then(key => {
          if(key) {
            this.publicKey = key;
            resolve(undefined);
          } else {
            reject(undefined);
          }
        });
    });
  }

  public verify = async (
    signature?: string, 
    timestamp?: string, 
    body?: string
  ): Promise<void> => {
    await this.ready;
    
    if(!this.publicKey)
      throw new Error(VerificationError.MISSING_PUBLIC_KEY);

    if(!signature || !timestamp)
      throw new BadRequestError(VerificationError.MISSING_SIGNATURE_TIMESTAMP);

    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, 'hex'),
      Buffer.from(this.publicKey, 'hex')
    );

    if(!isVerified)
      throw new UnauthorizedError(VerificationError.INVALID_SIGNATURE);
  };
}
