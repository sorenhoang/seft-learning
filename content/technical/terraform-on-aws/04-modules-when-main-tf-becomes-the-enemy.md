---
title: "Modules — When Your Single main.tf Becomes the Enemy"
order: 4
tags: ["terraform", "aws", "modules", "vpc", "ec2"]
date: "2026-04-29"
draft: false
lang: "en"
---

So far our `main.tf` has one resource. It fits on a screen. As the running example grows — a VPC, a public subnet, an Internet Gateway, a route table, a security group, an EC2 instance, an S3 bucket — that file rapidly becomes 200, then 400, then 800 lines. At some point someone makes a one-line change to a tag and breaks production because they accidentally edited the wrong block.

This is the **Terralith**: a monolithic Terraform configuration where every resource lives in one place and every change has unbounded blast radius. The cure is **modules**.

This chapter explains what a module is, builds one from scratch, shows when to use a community module instead, and refactors the running example into a clean modular layout.

---

## What a module actually is

> **Note on the directory.** From this chapter forward we'll refer to the working directory as `terraform-running-example/` rather than chapter 2's `terraform-first-deploy/`. Same project, broader scope — we're outgrowing "first deploy" as the name now that we're adding networking and compute.

A module is just a folder with `.tf` files in it. That's the entire definition.

Any folder with `.tf` files can be called as a module from another folder. Terraform doesn't care if the folder is local, on GitHub, or in a private registry — the calling syntax is the same.

```
terraform-running-example/
├── main.tf              ← root module (calls other modules)
├── variables.tf
├── outputs.tf
└── modules/
    └── networking/
        ├── main.tf      ← child module
        ├── variables.tf
        └── outputs.tf
```

The folder you run `terraform apply` in is called the **root module**. Anything it calls is a **child module**. Modules can call other modules. Recursion is allowed in theory but a smell in practice — most healthy projects are two levels deep at most.

---

## Why modules

Three concrete benefits, in order of how soon they'll bite you if you skip this step.

### 1. Blast radius

When the VPC, EC2 instance, and S3 bucket all live in `main.tf`, a typo in the security group rule causes Terraform to potentially recreate the EC2 instance, which destroys data on the instance store. With separate modules, a security-group change is a security-group change — Terraform's plan output makes that boundary visible.

### 2. Reuse

You will eventually need a second VPC. Maybe in another region, maybe in a staging environment. Without modules, you copy-paste 80 lines of HCL and forget to update one of them. With modules, you call the same module twice with different inputs.

### 3. Cognitive load

A 600-line `main.tf` is unreadable. A 100-line root `main.tf` that calls four well-named modules tells the story of your infrastructure in a glance: *we have a network, we have compute, we have storage, we have monitoring.*

> **Going deeper.** There's a counter-argument: premature modularization is also a problem. A module with one caller and three variables is almost always worse than the inline version — you've added indirection without earning reuse. The rule of thumb: **don't modularize until you have a reason to.** Three reasons that count: it's longer than ~80 lines, it'll be reused, or its lifecycle is genuinely different from the rest. Anything else is overengineering.

---

## Anatomy of a module

A child module has three files conventionally:

- **`variables.tf`** — the inputs. Anything the caller can configure.
- **`main.tf`** — the resources. The actual work.
- **`outputs.tf`** — the outputs. Anything the caller can read back.

Variables and outputs together form the module's **interface**. Inside the module is implementation; outside, only the interface matters.

### Variables

```hcl
# modules/networking/variables.tf

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "The CIDR block for the public subnet."
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "The AZ to place the public subnet in."
  type        = string
}

variable "tags" {
  description = "Tags applied to all networking resources."
  type        = map(string)
  default     = {}
}
```

Each variable has a `description` (write this — it shows up in tooling), a `type`, and an optional `default`. No default means the caller must supply a value.

### Resources

```hcl
# modules/networking/main.tf

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, { Name = "main-vpc" })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = merge(var.tags, { Name = "main-igw" })
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = merge(var.tags, { Name = "public-subnet" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(var.tags, { Name = "public-rt" })
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
```

Inside a module, conventionally name the "main" resource of each type `this` rather than something specific. This makes the module readable from outside.

### Outputs

```hcl
# modules/networking/outputs.tf

output "vpc_id" {
  description = "ID of the created VPC."
  value       = aws_vpc.this.id
}

output "public_subnet_id" {
  description = "ID of the public subnet."
  value       = aws_subnet.public.id
}
```

Outputs are how downstream callers (or other modules) reference what this module created. The EC2 instance in the next module needs the subnet ID — that comes from `module.networking.public_subnet_id`.

---

## Calling the module

Back in the root `main.tf`:

```hcl
# main.tf (root)

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }

  backend "s3" {
    bucket       = "tf-state-yourname-2026"
    key          = "running-example/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "terraform-on-aws"
      Environment = "learning"
      ManagedBy   = "terraform"
    }
  }
}

module "networking" {
  source = "./modules/networking"

  availability_zone = "us-east-1a"

  tags = {
    Component = "networking"
  }
}
```

Two things worth pausing on.

First, **`default_tags` on the provider** is the cleanest production-readiness win in all of Terraform. Every resource the AWS provider creates gets these tags automatically — no need to remember to add them per-resource. This is the only piece of "ops hygiene" we'll quietly bake in throughout the rest of the series; chapter 6 will say more about why.

Second, **the module's `source` is a relative path** (`./modules/networking`). Local modules are the right starting point. Remote sources (Git, registry) are introduced below.

---

## Adding compute and storage

Two more modules using the same pattern. Quick sketch only — the details aren't different.

```
modules/
├── networking/
├── compute/
│   ├── main.tf      # aws_instance, aws_security_group
│   ├── variables.tf # ami, instance_type, subnet_id, vpc_id, tags
│   └── outputs.tf   # instance_id, public_ip
└── storage/
    ├── main.tf      # aws_s3_bucket + versioning + public access block
    ├── variables.tf # bucket_name, tags
    └── outputs.tf   # bucket_arn, bucket_id
```

In the root `main.tf`:

```hcl
module "compute" {
  source = "./modules/compute"

  vpc_id        = module.networking.vpc_id
  subnet_id     = module.networking.public_subnet_id
  instance_type = "t3.micro"

  tags = { Component = "compute" }
}

module "storage" {
  source = "./modules/storage"

  bucket_name = "running-example-yourname-2026"

  tags = { Component = "storage" }
}
```

Notice how the root config now reads like a sentence: *we have networking, then compute that depends on networking, then storage.* You can hand this file to a new engineer and they get the shape of the system in 30 seconds without reading a single resource block.

---

## Community modules

Before you write your own VPC module, check what already exists.

The community module **`terraform-aws-modules/vpc/aws`** has been downloaded over 126 million times. It handles every edge case — multiple AZs, NAT gateways, VPN endpoints, flow logs, IPv6 — and is maintained by people who do this full-time. Using it looks like:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "main-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.10.0/24", "10.0.20.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}
```

Six lines of HCL replaces 60 lines of hand-rolled networking. The right answer almost always is "use the community module unless you have a specific reason not to."

### Pinning versions

`version = "~> 5.0"` means "any 5.x version, but not 6.0". Always pin module versions. The day a community module ships a 6.0 with breaking changes, your unpinned config will fail an apply at the worst possible moment.

> **Going deeper.** The `terraform-aws-modules` org on GitHub maintains modules for almost every common AWS resource — VPC, EKS, RDS, IAM, ALB, S3. They're worth bookmarking. Pattern: search for the resource you need at [registry.terraform.io](https://registry.terraform.io) before you start typing your own.

---

## When to write your own vs use the community version

| Situation | Build your own | Use community |
|---|---|---|
| Standard AWS resource (VPC, EKS, RDS) | | ✓ |
| Resource with company-specific compliance/tagging baked in | ✓ | |
| You want to learn how the resource works | ✓ | |
| You need to ship something next week | | ✓ |
| The community module has 50 inputs and you need 3 | ✓ | |

Pragmatic rule: **community modules first, custom modules when you've outgrown them.** The opposite mistake is more common than you'd think — teams hand-roll every module and end up maintaining 1,500 lines of HCL that 100 million other engineers also maintain.

---

## Final structure

After this refactor, the running example looks like:

```
terraform-running-example/
├── main.tf              # 30 lines — calls 3 modules
├── variables.tf
├── outputs.tf
└── modules/
    ├── networking/      # VPC, subnet, IGW, route table
    ├── compute/         # security group, EC2 instance
    └── storage/         # S3 bucket + hardening
```

Compare that to a flat `main.tf` of 400 lines. Same infrastructure, vastly more legible.

---

## What you should walk away with

- **A module is just a folder with `.tf` files.** No magic.
- **Modularize when something hits ~80 lines, gets reused, or has a different lifecycle.** Not before — premature modularization is its own problem.
- **The interface is the variables and outputs.** That's what callers see. Treat it like a public API.
- **Use community modules first.** `terraform-aws-modules/vpc/aws` exists for a reason.
- **Pin versions on everything.** Provider, modules, Terraform itself. The day a 6.0 breaks something, you'll be glad.
- **`default_tags` on the AWS provider is free production-readiness.** Set it on day one.

In chapter 5 we put this modular setup through its first real-world test: running it for multiple environments (dev, staging, prod), keeping secrets out of state, and getting it into a CI/CD pipeline so applies happen on pull-request merge instead of from your laptop.

---

*Next up — Chapter 5: Multi-Environment, Secrets, and CI/CD with Atlantis. We take the modular running example and run it across three environments through a real pull-request workflow.*
