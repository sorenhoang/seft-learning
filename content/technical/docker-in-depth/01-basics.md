---
title: "Docker Basics — Containers, Images, and the Docker Workflow"
order: 1
tags: ["docker", "containers", "devops"]
date: "2026-05-06"
draft: false
lang: "en"
---

## What Problem Docker Actually Solves

Before Docker, deploying software meant managing a fragile agreement between your code and the machine running it. "It works on my machine" wasn't a joke — it was a weekly incident. Libraries conflicted, environment variables drifted, OS versions diverged between dev and prod.

Docker solves this with a single guarantee: **the environment travels with the code**. You package your app, its runtime, its dependencies, and its config into one artifact. That artifact runs identically on your laptop, on CI, and in production.

---

## Containers vs. Virtual Machines

The most common confusion when learning Docker is treating containers like lightweight VMs. They're not.

A **virtual machine** emulates an entire computer — hardware included. Each VM runs its own OS kernel, which means 1 GB+ of overhead per instance, minutes to boot, and strict resource isolation.

A **container** shares the host OS kernel. It uses Linux primitives — **namespaces** (process, network, mount, user isolation) and **cgroups** (CPU, memory limits) — to create isolated environments without virtualizing hardware.

| | VM | Container |
|---|---|---|
| Boot time | 30–60s | < 1s |
| Size | GBs | MBs |
| OS overhead | Full kernel per VM | Shared host kernel |
| Isolation | Hardware-level | Process-level |
| Use case | Full OS isolation | App + dependency packaging |

Containers are faster to start, cheaper to run, and easier to move. The trade-off: they share the host kernel, so a kernel vulnerability affects all containers on that host.

---

## Images and Containers

Two terms you'll use every day:

- **Image** — a read-only, layered snapshot of a filesystem. Think of it as a blueprint. Images are built from a `Dockerfile` and stored in a registry.
- **Container** — a running instance of an image. You can run many containers from one image simultaneously.

The relationship: `Image → Container` is like `Class → Instance` in OOP, or `Dockerfile → docker run` in practice.

### Image Layers

Docker images are built in layers. Each instruction in a `Dockerfile` adds a new layer on top of the previous one. Layers are cached — if a layer hasn't changed, Docker reuses it during rebuilds.

```
Image: my-app:latest
├── Layer 1: ubuntu:22.04 (base OS)
├── Layer 2: apt-get install nodejs (runtime)
├── Layer 3: COPY package.json + npm install (dependencies)
└── Layer 4: COPY . . (application code)
```

This layering is why you should put frequently changing instructions (like `COPY . .`) at the bottom of your Dockerfile — it preserves the cache for the stable layers above.

---

## Writing Your First Dockerfile

A `Dockerfile` is a plain-text recipe for building an image. Here's a minimal Node.js example:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "src/index.js"]
```

Breaking this down instruction by instruction:

| Instruction | What it does |
|---|---|
| `FROM` | Sets the base image. Always the first instruction. |
| `WORKDIR` | Sets the working directory inside the container. Creates it if missing. |
| `COPY` | Copies files from the build context (your local machine) into the image. |
| `RUN` | Executes a shell command during the build. Result is committed as a new layer. |
| `EXPOSE` | Documents which port the container listens on. Does not publish it. |
| `CMD` | Default command when the container starts. Only one `CMD` takes effect. |

### `RUN` vs `CMD` vs `ENTRYPOINT`

These three are the most confused instructions:

- `RUN` executes at **build time** — it modifies the image. Use it to install packages, compile code.
- `CMD` executes at **run time** — it's the default process for the container. Can be overridden with `docker run <image> <command>`.
- `ENTRYPOINT` also executes at run time, but it's harder to override. Use it when your container should always run a specific executable (e.g., a CLI tool). `CMD` then becomes the default arguments.

```dockerfile
ENTRYPOINT ["npm", "run"]
CMD ["start"]
# docker run my-app         → runs: npm run start
# docker run my-app test    → runs: npm run test
```

---

## Core Docker Commands

### Building an Image

```bash
docker build -t my-app:latest .
```

- `-t my-app:latest` — name and tag the image (`name:tag`)
- `.` — build context (the directory Docker reads files from)

```bash
docker build -t my-app:1.0.0 --no-cache .
```

`--no-cache` forces a fresh build, skipping all layer caches. Useful when a dependency update isn't being picked up.

### Running a Container

```bash
docker run -d -p 3000:3000 --name my-app my-app:latest
```

| Flag | Meaning |
|---|---|
| `-d` | Detached mode — run in background |
| `-p 3000:3000` | Map host port 3000 → container port 3000 |
| `--name my-app` | Give the container a human-readable name |

```bash
docker run -it ubuntu:22.04 bash
```

`-it` = interactive + pseudo-TTY. Opens a shell inside the container. Useful for debugging.

### Managing Containers

```bash
docker ps                   # list running containers
docker ps -a                # list all containers (including stopped)
docker stop my-app          # gracefully stop (sends SIGTERM)
docker kill my-app          # force stop (sends SIGKILL)
docker rm my-app            # remove a stopped container
docker rm -f my-app         # force remove (stop + remove in one step)
```

### Managing Images

```bash
docker images               # list local images
docker pull node:20-alpine  # download image from registry
docker rmi my-app:latest    # remove an image
docker image prune          # remove all dangling (unused) images
```

### Inspecting and Debugging

```bash
docker logs my-app           # view container stdout/stderr
docker logs -f my-app        # follow logs in real time
docker exec -it my-app sh    # open a shell in a running container
docker inspect my-app        # full JSON config and state of a container
docker stats                 # live CPU/memory usage across all containers
```

`docker exec` is your primary debugging tool. When something goes wrong in production, this is how you get inside a running container to investigate without restarting it.

---

## The `.dockerignore` File

Just like `.gitignore`, a `.dockerignore` file tells Docker which files to exclude from the build context. This matters for two reasons: build speed (sending fewer files to the Docker daemon) and security (not leaking secrets into the image).

```
# .dockerignore
node_modules
.git
.env
*.log
dist
coverage
```

Without this, `docker build` copies your entire `node_modules` directory into the build context — even if you're installing fresh inside the container. On a large project that's hundreds of megabytes of unnecessary file transfer.

---

## Multi-Stage Builds

Multi-stage builds solve a common problem: your build tools (compilers, test frameworks, dev dependencies) shouldn't end up in the final production image.

```dockerfile
# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: production
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

The final image only contains what's in the `production` stage — no TypeScript compiler, no dev dependencies, no source files. This typically cuts image size by 50–80%.

---

## Pushing to a Registry

Docker Hub is the default public registry. Private registries like AWS ECR, GCR, or GitHub Container Registry follow the same workflow.

```bash
# log in
docker login

# tag with registry path
docker tag my-app:latest yourusername/my-app:latest

# push
docker push yourusername/my-app:latest

# pull on another machine
docker pull yourusername/my-app:latest
```

For private registries, the registry hostname is part of the tag:

```bash
docker tag my-app:latest 123456789.dkr.ecr.ap-southeast-1.amazonaws.com/my-app:latest
docker push 123456789.dkr.ecr.ap-southeast-1.amazonaws.com/my-app:latest
```

---

## Common Pitfalls

**Running as root.** By default, processes inside a container run as root. That's a security risk. Add a `USER` instruction to your Dockerfile:

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

**Storing secrets in the image.** Never use `ENV MY_SECRET=value` in a Dockerfile for sensitive data — it's baked into the image and visible in `docker history`. Pass secrets at runtime via `-e` flags or a secrets manager.

**One process per container.** Containers are designed around a single main process. If that process exits, the container stops. Avoid running multiple services (e.g., app + database) in one container — that's what Compose is for.

**Using `latest` in production.** The `latest` tag is mutable — it points to whatever was last pushed. Pin to a specific version (`node:20.11.0-alpine`) for reproducible builds.

---

## What's Next

You can now build images, run containers, and understand what's happening under the hood. But a real application is never just one container — it has a database, a cache, a message queue.

Before we reach Compose, we need to understand how containers talk to each other and how they persist data. That's Chapter 2: Networking & Volumes.
