import express from "express"
import { Request, Response, NextFunction } from "express"
import { Interaction, InteractionType } from "./types/discord"
import { AppResources } from "./types/AppResources"
import { DiscordSecurityMiddleware, ErrorMiddleware } from "./middleware"

export const appWrapper = (resources: AppResources) => {
  const app = express()

  app.set('resources', resources)

  app.use(express.json())
  app.use(DiscordSecurityMiddleware)

  app.post("/", (req: Request<{}, {}, Interaction>, res: Response, next: NextFunction) => {
    try {
      console.debug("Received interaction", req.body)
      const interaction = req.body

      // Handle different interaction types
      switch(interaction.type) {
        case InteractionType.PING:
          console.debug("Received PING interaction")

          // PONG back PING interactions
          res.json({
            type: InteractionType.PING
          })

          break;
        default:
          res.status(400)
            .json("Unknown interaction")
          break;
      }
    } catch(error) {
      next(error)
    }
  })

  app.use(ErrorMiddleware) // Catch errors

  return app
}
