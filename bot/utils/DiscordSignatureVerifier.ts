import * as nacl from "tweetnacl";
import { BadRequestError, UnauthorizedError } from "../types/HttpErrorTypes";

export enum VerificationError {
  MISSING_PUBLIC_KEY = "Missing Discord public key",
  MISSING_SIGNATURE_TIMESTAMP = "Missing signature or timestamp",
  INVALID_SIGNATURE = "Invalid request signature"
}

export class DiscordSignatureVerifier {
  constructor(private publicKey?: string) {
  }

  public verify = (
    signature?: string, 
    timestamp?: string, 
    body?: string
  ): void => {
    if(!this.publicKey)
      throw new Error(VerificationError.MISSING_PUBLIC_KEY);

    if(!signature || !timestamp)
      throw new BadRequestError(VerificationError.MISSING_SIGNATURE_TIMESTAMP);

    const isVerified = nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, "hex"),
      Buffer.from(this.publicKey, "hex")
    );

    if(!isVerified)
      throw new UnauthorizedError(VerificationError.INVALID_SIGNATURE)
  }
}
