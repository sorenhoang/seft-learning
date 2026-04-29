---
title: "Your First AWS Deployment — HCL, Providers, and the Four-Command Loop"
order: 2
tags: ["terraform", "aws", "hcl", "infrastructure-as-code"]
date: "2026-04-29"
draft: false
lang: "en"
---

In chapter 1 we argued the *why*. Now we do the *what*. By the end of this chapter you'll have written your first Terraform configuration, deployed a real piece of infrastructure to AWS, modified it, and torn it down — using the same four-command loop you'll use for every Terraform project for the rest of your career.

We'll keep the scope deliberately small. One resource: an S3 bucket. The point isn't to build something impressive — it's to internalize the loop and read the output of every command attentively. The next four chapters expand from this foundation; rushing past it costs you more time than it saves.

---

## Setting up your machine

Three things have to be true before we write any code.

### 1. Terraform 1.10 or later

Download from the [official Terraform site](https://developer.hashicorp.com/terraform/install) or via your package manager:

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Linux (apt)
sudo apt install terraform   # if your repo is current

# Verify
terraform version
```

You want **1.10 or later**. We'll use the S3 backend's new native locking feature in chapter 3, which only works on 1.10+. Older versions silently fall back to the deprecated DynamoDB pattern.

### 2. AWS CLI configured

```bash
aws configure
```

You'll be asked for an **Access Key ID**, **Secret Access Key**, **default region** (use `us-east-1` for these examples — cheaper free-tier eligibility, more regional services available), and **output format** (`json` is fine).

> **Going deeper.** For real projects, don't use long-lived access keys. Use AWS SSO or assume-role profiles via `aws configure sso`. We'll skip the setup here because it varies per organization, but for a personal learning account, an IAM user with programmatic access is acceptable. Just delete it when you're done.

### 3. A working AWS account

Use a personal account or a sandbox one. **Do not point Terraform at a production account at this stage.** Even though we'll only create an S3 bucket, mistakes happen, and your colleagues will not appreciate `terraform destroy` finding something it shouldn't.

---

## A first look at HCL

Before we write the file, a 60-second tour of the language.

**HashiCorp Configuration Language (HCL)** is what `.tf` files are written in. It's declarative, human-readable, and built around two units: **blocks** and **attributes**.

```hcl
# This is a block. "resource" is the block type, "aws_s3_bucket" is
# the first label, "example" is the second label (a local name we choose).
resource "aws_s3_bucket" "example" {
  # These are attributes — key/value pairs inside the block.
  bucket = "my-unique-bucket-name"
  
  # Blocks can be nested.
  tags = {
    Environment = "learning"
    Owner       = "me"
  }
}
```

That's 80% of what you need to read most Terraform code. The remaining 20% is **expressions** (referencing other resources, doing math, calling functions) and **variables** — both of which we'll meet as we go.

> **Going deeper.** HCL is intentionally limited compared to a real programming language. You can't write a `for` loop the way you would in Python. You can write `for_each` and `count`, but they operate on the resource graph, not as imperative iteration. This is the constraint we mentioned in chapter 1 — it's what makes `terraform plan` legible.

---

## Project setup

Make a working directory:

```bash
mkdir terraform-first-deploy
cd terraform-first-deploy
```

Create a single file called `main.tf`:

```hcl
# main.tf

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "first" {
  # S3 bucket names are globally unique across all of AWS.
  # Replace "yourname" with something unlikely to clash.
  bucket = "terraform-first-deploy-yourname-2026"

  tags = {
    Project = "terraform-on-aws"
    Chapter = "02"
  }
}
```

Three things are happening here:

1. **The `terraform` block** declares which Terraform version and which providers we need. Pinning versions is non-negotiable in a real project — we'll reinforce why in chapter 4.
2. **The `provider` block** configures the AWS provider. The provider needs to know *which AWS to talk to*; we tell it `us-east-1`. Credentials come from the AWS CLI config you set up earlier — Terraform automatically picks them up.
3. **The `resource` block** says: I want an S3 bucket. The first label `aws_s3_bucket` is the resource type (defined by the AWS provider); `first` is the local name we'll use to reference it elsewhere in our code.

Replace `yourname-2026` with something genuinely unique — S3 bucket names are global. If two AWS customers anywhere in the world have the same name, the second one fails.

---

## The four-command loop

Almost every Terraform workflow you'll ever run is some sequence of these four commands. Learn what each one does and never run them on autopilot.

### `terraform init` — wake up the workspace

```bash
terraform init
```

This is the first command in any new directory. It does two things:

1. **Downloads the providers** declared in your `terraform` block (the AWS provider is ~400MB — don't worry, it's cached).
2. **Initializes the backend** — for now, the backend is "local" (a `terraform.tfstate` file in this directory). In chapter 3 we change this.

You only need to run `init` again when you change your provider versions or your backend.

### `terraform plan` — see the diff before you commit

```bash
terraform plan
```

This is the **safety net of Terraform** and the single most important command. It compares:

- What's in your `.tf` files (the desired state)
- What's in your `terraform.tfstate` file (what Terraform built last time)
- What actually exists in AWS (queried via the provider)

…and prints what it would do to make them all line up. The output looks like this:

```
Terraform will perform the following actions:

  # aws_s3_bucket.first will be created
  + resource "aws_s3_bucket" "first" {
      + bucket                      = "terraform-first-deploy-yourname-2026"
      + bucket_domain_name          = (known after apply)
      + force_destroy               = false
      + id                          = (known after apply)
      + tags                        = {
          + "Chapter" = "02"
          + "Project" = "terraform-on-aws"
        }
      ...
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

**Read this every time.** The summary line — `Plan: X to add, Y to change, Z to destroy` — is the headline. If you expected to add one thing and the plan wants to destroy two, stop and figure out why before you continue. This is the moment that prevents production incidents.

### `terraform apply` — make it so

```bash
terraform apply
```

Apply runs `plan` again and then asks you to confirm by typing `yes`. After confirmation it executes the changes and updates the state file.

```
Plan: 1 to add, 0 to change, 0 to destroy.

Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes

aws_s3_bucket.first: Creating...
aws_s3_bucket.first: Creation complete after 3s [id=terraform-first-deploy-yourname-2026]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
```

The bucket now exists. Open the AWS console, go to S3, and you'll see it.

### `terraform destroy` — undo everything

```bash
terraform destroy
```

`destroy` is the opposite of `apply`: it deletes everything Terraform manages in this directory. We'll use it at the end of this chapter, but **be careful with it in any real project** — it is exactly as destructive as it sounds. There's no `--dry-run`; the dry run is `terraform plan -destroy`.

---

## Make a change and watch the loop work

Edit `main.tf` and add a tag:

```hcl
  tags = {
    Project = "terraform-on-aws"
    Chapter = "02"
    Owner   = "me"
  }
```

Run `terraform plan` again:

```
  # aws_s3_bucket.first will be updated in-place
  ~ resource "aws_s3_bucket" "first" {
        id                          = "terraform-first-deploy-yourname-2026"
      ~ tags                        = {
            "Chapter" = "02"
          + "Owner"   = "me"
            "Project" = "terraform-on-aws"
        }
        # (other unchanged attributes hidden)
    }

Plan: 0 to add, 1 to change, 0 to destroy.
```

The `~` symbol means "modify in place". The `+` next to `Owner` shows the new tag being added. No bucket is being recreated — just the tag set updated. This is what *declarative* means: you didn't tell Terraform "add a tag", you told it the new desired state and Terraform computed the diff.

Run `terraform apply` to confirm the change.

---

## Glance at the state file

In your directory you now have a file called `terraform.tfstate`. Open it. It's JSON. Inside, you'll see something like:

```json
{
  "version": 4,
  "terraform_version": "1.10.0",
  "resources": [
    {
      "type": "aws_s3_bucket",
      "name": "first",
      "instances": [
        {
          "attributes": {
            "bucket": "terraform-first-deploy-yourname-2026",
            "tags": { "Chapter": "02", "Owner": "me", "Project": "terraform-on-aws" },
            ...
          }
        }
      ]
    }
  ]
}
```

This file is **Terraform's memory of what it built**. We'll spend all of chapter 3 unpacking why this file deserves more attention than any other artifact in your project — and why leaving it on your laptop is the most common rookie mistake.

For now, just notice that it exists, that it's plain JSON, and that it has a complete record of the bucket Terraform created.

---

## Clean up

```bash
terraform destroy
```

Type `yes`. The bucket is gone. The `terraform.tfstate` file remains but now lists zero managed resources.

---

## What you should walk away with

- **The four-command loop**: `init` → `plan` → `apply` → `destroy`. This is 95% of Terraform usage.
- **HCL is declarative.** You describe the destination, not the route.
- **`plan` is the safety net.** Read it every time. The headline `Plan: X to add, Y to change, Z to destroy` is the most important line in the whole tool.
- **The state file is real.** Terraform keeps a record of what it built, and that record is currently sitting on your laptop in a `.tfstate` file.

That last point is the cliffhanger. In chapter 3 we look at why local state is dangerous, what remote state buys you, and why "use S3 with native locking" is the 2026 default for AWS teams.

---

*Next up — Chapter 3: State: The Most Important File You've Never Thought About. We open the `.tfstate` file properly, find out exactly what's in there, and migrate it to a remote backend so a teammate could safely run the same commands tomorrow.*
