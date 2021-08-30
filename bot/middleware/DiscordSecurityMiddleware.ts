import { NextFunction, Request, Response } from "express"
import * as nacl from "tweetnacl"

export const DiscordSecurityMiddleware = (PUBLIC_KEY: string) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.get("X-Signature-Ed25519")
      const timestamp = req.get("X-Signature-Timestamp")

      console.debug("Signature", signature)
      console.debug("Timestamp", timestamp)

      if(!signature || !timestamp) {
        res.status(400)
          .end("Invalid request headers");
        return;
      }

      const body = JSON.stringify(req.body)

      const isVerified = nacl.sign.detached.verify(
        Buffer.from(timestamp + body),
        Buffer.from(signature, 'hex'),
        Buffer.from(PUBLIC_KEY, 'hex')
      )

      if(!isVerified)
        res.status(401)
          .end("Invalid request signature")
    } catch(error) {
      next(error)
    }
  };
