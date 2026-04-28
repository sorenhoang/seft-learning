---
title: "Every Networking Concept Explained: From a Single Server to Kubernetes"
description: "A condensed walkthrough of networking — IP, DNS, ports, subnets, NAT, VPC, Docker, and Kubernetes — by following how a real application grows."
tags: ["Networking", "DevOps", "Cloud", "Kubernetes", "Docker"]
date: "2026-04-29"
draft: false
---

# Every Networking Concept Explained: From a Single Server to Kubernetes

> **Source video:** [Every Networking Concept Explained In 20 Minutes](https://www.youtube.com/watch?v=xj_GjnD4uyI) by *TechWorld with Nana* (Dec 10, 2025)

Networking can feel overwhelming when you try to learn it all at once — IP, DNS, NAT, VPC, CNI, Ingress... the acronyms pile up fast. The smartest way to approach it is to follow how a real application *grows*: start with one server on the internet, then add complexity only when something forces you to. Each new networking concept shows up exactly when it becomes necessary.

Here's the full journey, condensed.

---

## 1. A single server on the internet — IP & DNS

Imagine you've just deployed a web app on one server. For anyone to reach it, the server needs an **IP address** — a unique numeric label like `203.0.113.42` that identifies it on the internet. Every device on a network has one.

But humans don't memorize numbers; we remember names. That's where **DNS (Domain Name System)** comes in. When a user types `myapp.com` into their browser, a DNS resolver translates that name into the server's IP address. Think of DNS as the internet's phonebook.

So the flow is simple:

```
User types myapp.com  →  DNS resolves to 203.0.113.42  →  Browser connects to the server
```

That's all you need... until you want to run more than one thing on that server.

---

## 2. Multiple apps on one server — Ports

Now suppose you also deploy an API and a database on the same machine. They all share one IP address — so how does traffic know where to go?

**Ports.** A port is a numbered door on the server. Each running application listens on its own port:

- Web server → port `80` (HTTP) or `443` (HTTPS)
- API → port `8080`
- Database → port `5432` (PostgreSQL)

An incoming request targets `IP:port`, and the OS hands it to whichever app owns that port. Ports below 1024 are reserved for well-known services; above that, you can pick freely.

---

## 3. Growing up — Subnets, Routing & Firewalls

As your system grows, you don't want everything on one flat network. Putting your database on the same network as your public-facing web servers is a security nightmare.

**Subnets** let you split a larger network into smaller, isolated pieces. For example:

- **Public subnet** → web servers, reachable from the internet
- **Private subnet** → application servers and databases, only reachable internally

**Routing** is what connects these subnets. A router (or routing table) decides where a packet should go based on its destination IP. Without routes, traffic between subnets simply has no path.

**Firewalls** then control *who* can talk to *what*. A firewall is a set of rules: allow port 443 from anywhere, allow port 5432 only from the app subnet, deny everything else. In the cloud, these are usually called **security groups** or **network ACLs**.

Together, segmentation + routing + firewalls give you defense in depth.

---

## 4. Sharing one public IP — NAT

Public IPv4 addresses are scarce and expensive. You don't want every internal server to have its own public IP — most of them shouldn't be reachable from the internet anyway.

**NAT (Network Address Translation)** solves this. A NAT gateway sits at the edge of your network with one public IP. When an internal machine wants to reach the internet, the NAT rewrites the packet so it looks like it came from the gateway, then maps the response back to the right internal machine.

Two flavors worth knowing:

- **Source NAT (outbound):** internal servers reach the internet through a shared public IP
- **Destination NAT / port forwarding (inbound):** external traffic to a public IP gets redirected to a specific internal server

This is why your laptop and your phone at home both browse the internet through your router's single public IP.

---

## 5. Cloud networking — VPC, subnets & gateways

Move all of this into the cloud (AWS, GCP, Azure) and the same concepts come back with cloud-specific names.

A **VPC (Virtual Private Cloud)** is your own private, logically isolated network inside the cloud provider. Inside a VPC you define:

- **Subnets** — usually one per availability zone, split into public and private
- **Route tables** — what traffic goes where
- **Internet Gateway** — attached to public subnets, lets resources reach the internet
- **NAT Gateway** — lets private subnet resources reach the internet *outbound only*
- **Security groups** — instance-level firewalls
- **Network ACLs** — subnet-level firewalls

A typical pattern: load balancer in a public subnet, application servers in a private subnet, database in an even more locked-down private subnet. Traffic flows in through the load balancer; nothing reaches the database directly from the outside.

---

## 6. Container networking — Docker

Now your app runs in containers. Each container gets its own isolated network namespace, which means its own virtual interface and IP — but those IPs only exist inside the host.

Docker handles this with **bridge networks** by default. A virtual bridge (`docker0`) sits on the host, and every container connects to it. Containers on the same bridge can talk to each other directly by IP or container name.

To expose a container to the outside world, you use **port mapping**: `-p 8080:80` says "forward host port 8080 to container port 80." Behind the scenes, that's NAT again — Docker rewrites the packets.

Other modes worth knowing:

- **host** — container shares the host's network directly (no isolation, no port mapping)
- **none** — no networking at all
- **overlay** — connects containers across multiple hosts (used by Docker Swarm)

---

## 7. Kubernetes networking — Pods, Services & Ingress

Kubernetes raises the abstraction level again. Three concepts do most of the work:

**Pods.** The smallest deployable unit. Every pod gets its own cluster-internal IP, and containers inside a pod share that IP and network namespace (they talk to each other over `localhost`). Pods can reach each other directly across the cluster — no NAT between pods.

**Services.** Pods are ephemeral; their IPs change every time they restart. A Service gives you a *stable* virtual IP and DNS name that load-balances across a set of pods. The main types:

- **ClusterIP** — internal-only, the default
- **NodePort** — exposes the service on a port on every node
- **LoadBalancer** — provisions a cloud load balancer with a public IP

**Ingress.** Once you have multiple services to expose over HTTP, you don't want a separate LoadBalancer for each one — that's expensive and messy. An Ingress is a single entry point that routes external HTTP/HTTPS traffic to the right service based on hostname or path. For example, `api.myapp.com` → API service, `myapp.com` → frontend service. An **Ingress Controller** (NGINX, Traefik, etc.) does the actual routing.

---

## The big picture

The whole stack stays consistent — it's just the same ideas applied at different layers:

| Layer       | "Where does this packet go?"                  | "Who's allowed to send it?"            |
|-------------|-----------------------------------------------|----------------------------------------|
| Server      | IP + port                                     | OS firewall                            |
| Datacenter  | Subnets + routing                             | Firewalls / ACLs                       |
| Cloud       | VPC + route tables + gateways                 | Security groups + NACLs                |
| Containers  | Bridge networks + port mapping                | Docker network policies                |
| Kubernetes  | Pod IPs + Services + Ingress                  | NetworkPolicies                        |

Once you see the pattern — *addressing, routing, and access control* repeated at each layer — networking stops feeling like a wall of acronyms and starts feeling like the same problem solved over and over with better tools.

---

*If you want the visual walkthrough that inspired this post, watch Nana's full 20-minute breakdown here: [https://www.youtube.com/watch?v=xj_GjnD4uyI](https://www.youtube.com/watch?v=xj_GjnD4uyI)*
