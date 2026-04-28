# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm lint              # ESLint on all TypeScript files
pnpm test:unit         # Run all unit tests (vitest)
pnpm test:unit <path>  # Run a single test file
pnpm test:coverage     # Run tests with V8 coverage
pnpm deploy            # Deploy all CDK stacks (requires AWS credentials + STAGE env var)
```

## Architecture

This is a **serverless Discord bot** ("Wednesday Bot") deployed on AWS via CDK. The bot fetches Reddit memes and posts them to Discord channels on a weekly schedule.

### High-Level Flow

1. **Discord interactions** → API Gateway → `route-discord-webhook-action` Lambda (validates Discord signature, routes slash commands)
2. **Slash commands** → invoke `configure-bot` Lambda (register/delete per-server schedules in DynamoDB)
3. **Weekly EventBridge cron** (Wednesdays) → `send-wednesday-meme` Lambda → fetches Reddit meme → posts to each registered Discord channel

### Code Organization

```
src/
  lib/                         # Shared library code
    adapters/                  # AWS SDK + HTTP clients (DynamoDB, Lambda, SSM, Axios, OAuth)
    repositories/              # External API clients (Discord, Reddit)
    domain/                    # Shared domain models
    schemas/                   # Zod schemas for events and REST payloads
    util/                      # API Gateway helpers, Discord sig verification, retry, logging
    errors/                    # Custom error classes
  bots/
    wednesday/                 # Bot-specific implementation
      config.ts                # Zod-validated env config
      di.ts                    # Dependency injection wiring
      domain/                  # Bot-specific domain models
      entrypoints/             # Lambda handlers (rest/ and events/)
      repositories/            # Bot-specific data access (DynamoDB, Lambda invocation)
      orchestration/           # Multi-usecase orchestration
      usecases/                # Business logic units
      iac/                     # CDK stack definition
bin/
  iac.ts                       # CDK app entry point
```

### Patterns

- **Clean Architecture**: entrypoints → usecases → repositories → adapters. Usecases receive dependencies via constructor injection.
- **Dependency Injection**: `di.ts` wires all adapters/repos/usecases together; `makeDeps()` factory is used in tests to provide mocks.
- **Config validation**: Each bot has a `config.ts` using Zod that validates environment variables at Lambda cold start. Fails fast if required vars are missing.
- **Path alias**: `@lib/*` maps to `src/lib/*` (defined in tsconfig and vitest config).

### Infrastructure

- DynamoDB table: bot registrations keyed on `serverId` + `channelId`
- Secrets Manager: Discord credentials (app ID, token, public key) and Reddit OAuth credentials
- SSM Parameter Store: API URLs and Reddit user agent string
- Lambdas bundled via CDK's `NodejsFunction` (esbuild); Node.js 22.x runtime
