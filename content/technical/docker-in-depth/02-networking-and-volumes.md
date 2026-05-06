---
title: "Networking & Volumes — Connecting and Persisting Data"
order: 2
tags: ["docker", "networking", "devops"]
date: "2026-05-06"
draft: false
lang: "en"
---

## Why Networking and Storage Are Different in Docker

A container is isolated by design — it has its own filesystem, its own network stack, its own process tree. That isolation is the feature. But it creates two real problems for any non-trivial application:

1. **How does one container talk to another?** Your API container needs to reach your database container.
2. **What happens to data when a container stops?** A container's filesystem is ephemeral — when the container is removed, everything written inside it is gone.

Docker's networking model and volume system are the answers to these two problems. Understanding them is prerequisite knowledge for everything that follows.

---

## Docker Networking

### The Default Bridge Network

When you install Docker, it creates a default bridge network called `bridge`. Every container you start without specifying a network gets attached to it.

```bash
docker network ls
# NETWORK ID     NAME      DRIVER    SCOPE
# abc123         bridge    bridge    local
# def456         host      host      local
# ghi789         none      null      local
```

On the default bridge, containers can reach each other by IP address — but not by name. That's the critical limitation. You'd need to look up the IP of each container manually, and IPs change on restart.

### User-Defined Bridge Networks

The fix is simple: create your own bridge network. Containers on a user-defined bridge can resolve each other **by container name**.

```bash
docker network create my-network

docker run -d --name postgres --network my-network postgres:16
docker run -d --name api --network my-network my-api:latest
```

Now from inside the `api` container, you can reach the database at `postgres:5432`. Docker's embedded DNS server handles the name resolution.

```bash
# inside the api container
curl http://postgres:5432
# works — Docker resolves "postgres" to the container's IP
```

This is the pattern you'll use for every multi-container setup before Compose.

### Network Drivers

| Driver | Use case |
|---|---|
| `bridge` | Default. Containers on the same host. |
| `host` | Container shares the host's network namespace. Max performance, zero isolation. |
| `overlay` | Multi-host networking for Swarm or Kubernetes. |
| `none` | No networking. Fully isolated. |
| `macvlan` | Assigns a MAC address to the container — makes it appear as a physical device on the network. |

For most applications you'll use `bridge`. `host` is useful for performance-critical tools (e.g., monitoring agents). `overlay` comes into play in Chapter 6 on orchestration.

### Port Mapping

By default, a container's ports are not accessible from outside. Port mapping punches a hole through the isolation:

```bash
docker run -d -p 8080:3000 my-api:latest
```

`-p host_port:container_port` — traffic arriving at `localhost:8080` is forwarded to port `3000` inside the container.

You can map multiple ports, bind to a specific interface, or use UDP:

```bash
docker run -d \
  -p 8080:3000 \
  -p 127.0.0.1:9090:9090 \
  -p 5353:5353/udp \
  my-app:latest
```

Binding to `127.0.0.1` restricts the port to loopback only — useful for admin endpoints you don't want exposed on a public interface.

### Inspecting Networks

```bash
docker network inspect my-network    # full JSON: containers, IPs, config
docker network connect my-network api   # attach a running container to a network
docker network disconnect my-network api
docker network rm my-network
```

---

## Docker Volumes

### The Ephemeral Filesystem Problem

Every container starts with a fresh copy of its image filesystem. Writes happen in a thin writable layer on top. When the container is removed, that layer is gone.

```bash
docker run -d --name db postgres:16
# write some data...
docker rm -f db
# all data is gone
```

For stateless apps (most web servers), this is fine. For anything stateful — databases, file uploads, logs — you need a way to persist data outside the container lifecycle.

### Three Ways to Mount Storage

Docker gives you three options:

```
Host filesystem
      │
  ┌───▼────────────────────────────────────────────┐
  │  Volumes (managed by Docker, in /var/lib/docker) │
  │  Bind mounts (specific host path)                │
  │  tmpfs mounts (in-memory only)                   │
  └──────────────────────────────────────────────────┘
```

**1. Volumes** — Docker-managed storage. The recommended approach.

```bash
docker volume create pgdata

docker run -d \
  --name postgres \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16
```

The data lives at a Docker-managed path on the host. You don't specify where — Docker handles it. Volumes persist across container restarts and removals. They're also the right choice for sharing data between containers.

**2. Bind Mounts** — Mount a specific host directory into a container.

```bash
docker run -d \
  -v /home/user/myapp:/app \
  my-app:latest
```

The host path `/home/user/myapp` is mounted at `/app` inside the container. Changes on either side are reflected immediately — this is why bind mounts are the standard approach for local development.

```bash
# development workflow: live reload without rebuilding
docker run -d \
  -v $(pwd):/app \
  -v /app/node_modules \
  -p 3000:3000 \
  my-app:dev
```

The second `-v /app/node_modules` is a common trick: it creates an anonymous volume for `node_modules` inside the container, preventing the host's `node_modules` (or lack thereof) from overwriting the container's installed dependencies.

**3. tmpfs Mounts** — In-memory storage. Not persisted to disk, not shared between containers.

```bash
docker run -d \
  --tmpfs /tmp \
  my-app:latest
```

Useful for sensitive data that should never touch disk, or for high-speed temporary storage.

### Volume Commands

```bash
docker volume ls                      # list all volumes
docker volume inspect pgdata          # show volume details (mountpoint, etc.)
docker volume rm pgdata               # remove a volume
docker volume prune                   # remove all unused volumes
```

### Volumes vs. Bind Mounts — When to Use Which

| | Volume | Bind Mount |
|---|---|---|
| **Location** | Docker-managed (`/var/lib/docker/volumes/`) | Specific host path |
| **Best for** | Production, databases, stateful services | Local development, config injection |
| **Portability** | High — works on any Docker host | Low — depends on host directory structure |
| **Performance** | Optimized for Docker | Slightly slower on Mac/Windows (due to file sync overhead) |
| **Backup/migrate** | `docker volume` commands or `--volumes-from` | Regular filesystem tools |

In production: use named volumes. In local dev: use bind mounts. Don't use anonymous volumes (volumes with no name) in production — they're hard to track and easy to accidentally prune.

---

## Practical Patterns

### Database with Persistent Storage

```bash
docker network create app-net

docker run -d \
  --name postgres \
  --network app-net \
  -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=myapp \
  postgres:16

docker run -d \
  --name api \
  --network app-net \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:secret@postgres:5432/myapp \
  my-api:latest
```

The `api` container reaches the database via the container name `postgres` on `app-net`. The data survives container restarts because it lives in the `pgdata` volume.

### Sharing Files Between Containers

```bash
docker volume create shared-uploads

docker run -d --name app -v shared-uploads:/app/uploads my-app:latest
docker run -d --name nginx -v shared-uploads:/usr/share/nginx/html/uploads nginx:alpine
```

Both containers read and write the same volume. The `nginx` container can serve files that `app` wrote.

### Read-Only Mounts

You can mount a volume or bind mount as read-only by appending `:ro`:

```bash
docker run -d \
  -v $(pwd)/config:/app/config:ro \
  my-app:latest
```

The container can read from `/app/config` but cannot write to it. Good for mounting configuration files you don't want the app to modify.

---

## Debugging Network Issues

When containers can't reach each other, work through this checklist:

```bash
# 1. confirm both containers are on the same network
docker inspect container_name | grep -A 20 '"Networks"'

# 2. test connectivity from inside a container
docker exec -it api sh
ping postgres          # can we resolve the name?
curl http://postgres:5432  # can we reach the port?

# 3. check if the target container's port is actually listening
docker exec -it postgres sh
ss -tlnp | grep 5432

# 4. check network details
docker network inspect app-net
```

A common mistake: the containers are on different networks. The default `bridge` network and a user-defined network are completely separate. A container on `bridge` cannot reach a container on `app-net` by name (or at all, without explicit IP).

---

## What's Next

You now know how to make containers talk to each other and persist their data. But managing all these `docker run` commands manually — networks, volumes, environment variables, port mappings — doesn't scale. Chapter 3 introduces Docker Compose, which defines your entire multi-container stack in a single YAML file.
