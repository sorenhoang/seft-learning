---
title: "Why IaC, Why Terraform, and What This Series Isn't"
order: 1
tags: ["terraform", "aws", "infrastructure-as-code", "devops"]
date: "2026-04-29"
draft: false
lang: "en"
---

Before we write any HCL or run any `terraform apply`, we need to agree on something: **why does this exist at all?** Infrastructure-as-Code is one of those ideas that sounds obvious in hindsight but solves a very specific kind of pain. If you don't feel that pain yet, the rest of the series will read like ceremony. So we'll start with the pain.

---

## The world before IaC

Picture how a company without IaC builds its AWS environment.

Someone — let's call her Linh — opens the AWS console, clicks **EC2 → Launch Instance**, picks an AMI, fills in a security group, hits go. Five minutes later, there's a server. Linh writes down what she did in a Notion page so she doesn't forget. Two weeks later, the team needs a *staging* version. Linh opens Notion, follows her own notes, clicks the same buttons. Mostly the same buttons. She forgets one tag.

Six months later, Linh leaves the company. Her replacement, Khoa, needs to update the security group. He opens the AWS console and finds **forty-three** EC2 instances, none of them tagged consistently, half of them with security groups named `sg-old`, `sg-old-2`, `sg-temp-do-not-delete`. He has no idea which one is production.

This is **click-ops**, and it has predictable failure modes:

- **No audit trail.** Who created `sg-old-2`? Why? When? Nobody knows.
- **Drift between environments.** Dev and staging slowly diverge from production. The bug that "doesn't reproduce in dev" is usually drift.
- **Snowflake servers.** Each instance is subtly unique because it was hand-tuned over time. Replacing one is risky.
- **No code review.** A typo in a security group rule goes straight to production with no second pair of eyes.
- **The bus factor is one.** The person who built it is the only person who can fix it.

Every painful AWS migration story you've ever heard starts here.

---

## What IaC actually is

**Infrastructure-as-Code** is a deceptively simple idea: instead of clicking buttons, you describe your infrastructure in a text file, check that file into git, and let a tool reconcile reality with the file.

That's it. The shift sounds small, but it changes everything that was broken in the click-ops world:

| Click-ops problem | What IaC gives you |
|---|---|
| No audit trail | `git log` is the audit trail |
| Drift between environments | Same code → same infrastructure |
| Snowflake servers | Servers are disposable; the code is the source of truth |
| No code review | Pull requests and `terraform plan` diffs |
| Bus factor of one | The infrastructure exists in the repo, not in someone's head |

The change you have to internalize: **the code is the infrastructure, and the running infrastructure is just a projection of it.** If those two diverge — because someone clicked something in the console — that's a bug, not a normal state of affairs.

---

## Why Terraform specifically

There are a half-dozen credible IaC tools today: **CloudFormation** (AWS-native), **Pulumi** (general-purpose programming languages), **AWS CDK** (TypeScript/Python that compiles to CloudFormation), **Ansible** (more config-management than provisioning), and a long tail.

Terraform stands out for three reasons that matter for a learning series:

1. **It's declarative.** You describe the *desired state* — "I want this VPC, this subnet, this EC2 instance" — and Terraform figures out what to create, change, or destroy to get there. You don't write the steps; you write the destination.

2. **It separates plan from apply.** Before any change happens, Terraform shows you a diff: "I'm going to create 3 things, modify 1, destroy 2." This is the safety net that lets you sleep at night. CloudFormation has change sets; nothing else has it as cleanly.

3. **The ecosystem is massive.** Public modules like `terraform-aws-modules/vpc/aws` have over 100 million downloads. There are providers for AWS, Cloudflare, Datadog, GitHub, Stripe, Auth0 — anything with an API has a Terraform provider. You learn the tool once and apply it everywhere.

> **Going deeper.** Pulumi and CDK make a strong case for "use a real programming language instead of HCL." That tradeoff is real — HCL has limits — but it comes with a downside: when your IaC is TypeScript, your `plan` output gets fuzzier and your team needs to be fluent in both ops *and* the chosen language. Terraform's HCL is a constraint, but constraints are sometimes a feature. We're not going to relitigate this debate; we're going to learn the most common tool well.

---

## The OpenTofu question

If you've searched for Terraform tutorials in the last two years, you've seen the name **OpenTofu**. Quick version: in 2023 HashiCorp changed Terraform's license from MPL to BSL (Business Source License), which made some commercial uses unclear. The community forked the last MPL-licensed version into OpenTofu, governed by the Linux Foundation.

For a learner, here's the only thing you need to know: **the syntax, commands, and mental model are essentially identical.** A Terraform tutorial teaches you OpenTofu and vice versa. If your team has standardized on OpenTofu for licensing reasons, you can read this entire series, swap the binary, and 95% of it works untouched.

We're using Terraform throughout because it's still the more common name in job descriptions, blog posts, and AWS documentation. That's it — no deeper reason.

---

## What this series isn't

Setting expectations is half the value of a series like this. Here's what we are **not** going to cover:

- **Terraform on Azure or GCP.** Every example uses AWS. Concepts transfer, exact resource names don't.
- **Kubernetes provisioning.** Terraform can stand up an EKS cluster, but Helm, Argo CD, and the cluster-internal world are their own series.
- **Pulumi, CDK, or CloudFormation.** Mentioned for context, never used.
- **OpenTofu specifics.** See above.
- **HashiCorp Certified Terraform Associate exam prep.** This series will help you understand the material, but we don't drill memorization questions.
- **Advanced patterns for platform teams.** Things like custom providers, dynamic provider configuration, and complex `for_each` gymnastics are out of scope. We stop at "you can run this in production with confidence."

If any of those is what you're looking for, this is the wrong series. That's fine — go find the right one.

---

## What this series *is*

Six chapters. AWS-only examples. A single running scenario — a VPC, a public subnet, an EC2 instance, an S3 bucket — that we build up across chapters 2 through 4 and then put through a real CI/CD flow in chapter 5. By chapter 6, we look at the patterns you'd see at a more mature organization and decide which of them you actually need.

Here's the spine, restated for context:

| # | Chapter | The question it answers |
|---|---|---|
| 1 | Why IaC, Why Terraform, and What This Series Isn't | *(you are here)* |
| 2 | Your First AWS Deployment | What does Terraform actually do, end to end? |
| 3 | State: The Most Important File You've Never Thought About | Why is `terraform.tfstate` such a big deal? |
| 4 | Modules — When Your Single `main.tf` Becomes the Enemy | How do I keep this manageable as it grows? |
| 5 | Multi-Environment, Secrets, and CI/CD with Atlantis | How do I run this safely with a team? |
| 6 | Governance and the Long Game | What does mature Terraform usage look like? |

The chapters are written to be read in order, but each one stands on its own enough that you can come back to chapter 4 a month later as a reference.

---

## Prerequisites

To work through the examples you'll need:

- **An AWS account.** A free-tier account is fine for chapters 2–4. Chapter 5 may push you slightly over the free tier — we'll flag the costly bits.
- **The AWS CLI installed and configured** with a user that has reasonable permissions in a non-production account. We'll talk about scoping IAM properly in chapter 6, but for now: do not point this at your company's prod account.
- **Terraform installed** — version 1.10 or later is important, because we'll use the new S3 native state locking introduced in 1.10. Older tutorials use a DynamoDB table for locking; that pattern is now deprecated.
- **Basic comfort in a terminal** and rough familiarity with what an EC2 instance and an S3 bucket are.

That's it. No prior Terraform required.

> **Going deeper.** If you already know Terraform from a previous job and you're skimming for the parts that matter: chapter 3's S3 native locking section and chapter 6's policy-as-code section are where the freshest material is. The rest is groundwork.

---

## What you should walk away from chapter 1 with

Three ideas, in priority order:

1. **The reason IaC exists is to fix click-ops failure modes** — drift, snowflakes, no audit trail, single-person knowledge. If you don't feel those pains yet, you will the moment you join a team.
2. **Terraform's superpower is `plan`** — the safety net of seeing exactly what will change before it changes. Trust it. Read it every time.
3. **The code is the source of truth.** When the AWS console and your Terraform repo disagree, the repo wins, and the divergence is a bug to investigate, not a state to live with.

Hold those three in your head as we move into the next chapter, where we actually write Terraform for the first time and watch it create a real piece of infrastructure in your AWS account.

---

*Next up — Chapter 2: Your First AWS Deployment. We install Terraform, write our first `.tf` file, and walk through the four commands that make up almost every Terraform workflow you'll ever run.*
