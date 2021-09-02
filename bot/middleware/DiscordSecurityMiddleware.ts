import { NextFunction, Request, Response } from "express"
import * as express from "express"
import nacl from "tweetnacl"
import { AppResources } from "../types/AppResources"
import { BadRequestError, UnauthorizedError } from "../types/HttpErrorTypes"

export const DiscordSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { discordPublicKey } = req.app.get("resources") as AppResources
    if (!discordPublicKey)
      throw new Error("Discord information invalid, public key missing")

    let rawBody = ""
    req.on("data", (chunk) => {
      rawBody += chunk
    })

    req.on("end", () => {
      console.debug("Raw body", rawBody)

      const signature = req.get("X-Signature-Ed25519")
      const timestamp = req.get("X-Signature-Timestamp")

      console.debug("Signature", signature)
      console.debug("Timestamp", timestamp)
      console.debug("Public key", discordPublicKey)
      //console.debug("Body", req.body)

      if(!signature || !timestamp) {
        throw new BadRequestError("Invalid request headers")
      }

      const isVerified = nacl.sign.detached.verify(
        Buffer.from(timestamp + rawBody),
        Buffer.from(signature, 'hex'),
        Buffer.from(discordPublicKey, 'hex')
      )
      
      if(!isVerified) {
        throw new UnauthorizedError("Invalid request signature")
      }
    })
  } catch(error) {
    next(error)
  }
}
