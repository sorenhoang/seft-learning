---
title: "Docker Essentials I Wish I Knew Earlier"
description: "Practical Docker tips and patterns that save time in real projects."
tags: ["docker", "devops", "containers", "tips"]
date: "2024-03-20"
draft: false
---

# Docker Essentials I Wish I Knew Earlier

## Use multi-stage builds to keep images small

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage — only the output
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]
```

Final image only contains what the app needs to run — no dev tools, no source code.

## `.dockerignore` is as important as `.gitignore`

```
node_modules
.next
.git
*.log
.env.local
```

Without this, `COPY . .` sends gigabytes of `node_modules` to the build context.

## Use `docker compose watch` for development

```yaml
services:
  app:
    build: .
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
```

Files sync into the container on save — no full rebuild needed.
