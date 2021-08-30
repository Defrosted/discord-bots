import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as cloud from "@pulumi/cloud"

import * as express from "express"
import { Request, Response, NextFunction } from "express"
import { Interaction, InteractionType } from "./bot/types/discord"
import { DiscordSecurityMiddleware, ErrorMiddleware } from "./bot/middleware"

const cfg = new pulumi.Config()

const discordPublicKey = new aws.ssm.Parameter("discord-public-key", {
  type: "SecureString",
  value: cfg.requireSecret("discord_public_key")
})

const discordApplicationId = new aws.ssm.Parameter("discord-application-id", {
  type: "SecureString",
  value: cfg.requireSecret("discord_application_id")
})

const discordBotToken = new aws.ssm.Parameter("discord-bot-token", {
  type: "SecureString",
  value: cfg.requireSecret("discord_bot_token")
})

const thundraApiKey = new aws.ssm.Parameter("thundra-api-key", {
  type: "SecureString",
  value: cfg.requireSecret("thundra_api_key")
})

const botApi = new cloud.HttpServer("bot-api", () => {
  const app = express()

  // Register middleware
  app.use(express.json())
  app.use(DiscordSecurityMiddleware(discordApplicationId.value.get()))

  app.post("/", (req: Request<{}, {}, Interaction>, res: Response, next: NextFunction) => {
    try {
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
})

export const url = botApi
