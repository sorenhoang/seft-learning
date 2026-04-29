---
title: "Governance and the Long Game — Policy-as-Code, Drift, and Mature Teams"
order: 6
tags: ["terraform", "aws", "policy-as-code", "sentinel", "opa", "governance"]
date: "2026-04-29"
draft: false
lang: "en"
---

The previous five chapters got you to "I can run Terraform safely with a small team." This last chapter is about what happens when *safely* needs to scale — when there are five teams, then twenty, all using Terraform against the same AWS organisation. The risk profile shifts: it's no longer "did this engineer make a mistake" but "is this engineer allowed to do this thing in this account at all."

The answer is **governance**: a layer of automated rules and conventions that decides what changes are permitted before any human reviewer has to think about it. Two parts to it: lightweight hygiene (tags, naming, linting) and heavyweight enforcement (policy-as-code).

---

## The free win: `default_tags`

If you take only one production-readiness habit from this chapter, take this one.

```hcl
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "running-example"
      Environment = "prod"
      ManagedBy   = "terraform"
      Owner       = "platform-team"
      CostCenter  = "engineering"
    }
  }
}
```

Every resource the AWS provider creates inside this provider block automatically gets these tags. No `tags = merge(var.tags, ...)` boilerplate inside every module. No "oh, I forgot to tag this S3 bucket."

Why it matters:

- **Cost allocation.** Without tags, the AWS bill is a 200-line list of "EC2 - $4,237". With tags, it's "Project: running-example - $643". You cannot do FinOps without consistent tags.
- **Ownership.** When something breaks at 3am, the on-call engineer needs to know who owns the resource. `Owner = "platform-team"` is the difference between a 20-minute and a 2-hour incident.
- **Compliance.** Tags drive almost every automated compliance check. "All resources must have a CostCenter tag" is a one-line policy if `default_tags` is set, an organizational nightmare if it isn't.

The cost is one block of HCL per provider. Set it on day one of every new project. Skipping this almost always leads to regret within six months — usually the first time finance asks "why is the AWS bill what it is?"

> **Going deeper.** `default_tags` doesn't help you for resources that don't accept tags (a few exist) or resources created outside your provider block. For full coverage you also want **AWS Config** rules that check tag presence, and an organization-wide **Service Control Policy (SCP)** that denies resource creation without required tags. That's the enterprise version of the same idea.

---

## Lightweight hygiene: linting and naming

Two small tools belong in every Terraform repo from day one.

### `terraform fmt`

```bash
terraform fmt -recursive
```

Reformats every `.tf` file to canonical style. Add it as a pre-commit hook so every diff is formatted consistently. This is a 30-second setup that eliminates an entire category of code review noise forever.

### `tflint`

[`tflint`](https://github.com/terraform-linters/tflint) catches things `terraform validate` doesn't:

- AWS instance types that don't exist
- IAM policy syntax errors
- Deprecated resource attributes
- Missing required tags (with the AWS plugin)

```bash
tflint --recursive
```

In CI:

```yaml
- name: tflint
  run: |
    tflint --init
    tflint --recursive
```

It's not a security tool — it's a sanity-check tool that catches mistakes at PR time instead of `apply` time.

### Naming conventions

There's no Terraform-enforced naming convention, but pick one and stick to it. The convention I've seen work in practice:

- **Resource local names** are descriptive and singular: `aws_instance.web`, not `aws_instance.web_server_1`.
- **The first instance** of a resource type in a module is named `this`: `aws_vpc.this`.
- **Module folder names** are the *thing* the module manages: `modules/networking`, not `modules/network-stuff`.
- **AWS resource names** (the `Name` tag) include the environment and project: `prod-running-example-web`.

The specific rules matter less than the consistency. Pick something. Document it in the repo's README. Hold the line.

---

## Policy-as-code: the why

Tags and lint rules are conventions — pleasant to follow, easy to skip. **Policy-as-code** is enforcement: rules that block a `terraform apply` from succeeding if it violates them.

What kinds of rules?

- "S3 buckets must have encryption enabled."
- "EC2 instances must use approved AMIs from this list."
- "IAM policies cannot grant `*:*`."
- "Resources cannot be tagged with a `CostCenter` value not in our finance system."
- "Production deploys cannot run between Friday 18:00 and Monday 08:00 unless tagged `emergency = true`."

Each of these is a real rule a real company enforces. Without policy-as-code, they live in a wiki page that nobody reads. With policy-as-code, they're machine-checkable at the boundary between `plan` and `apply`.

Two tools dominate the space: **Sentinel** (HashiCorp, paid, deeply integrated) and **OPA** (open-source, vendor-agnostic).

---

## Sentinel

Sentinel is HashiCorp's policy-as-code framework, available only in **Terraform Cloud / HCP Terraform** and **Terraform Enterprise**. You can't use it with a self-hosted Atlantis setup. If you're on the paid HashiCorp tier, Sentinel is built in and well-supported.

A Sentinel policy looks like:

```hcl
# require-encryption.sentinel

import "tfplan/v2" as tfplan

s3_buckets = filter tfplan.resource_changes as _, rc {
    rc.type is "aws_s3_bucket_server_side_encryption_configuration" and
    (rc.change.actions contains "create" or rc.change.actions contains "update")
}

main = rule {
    all s3_buckets as _, sb {
        sb.change.after.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm in ["AES256", "aws:kms"]
    }
}
```

Sentinel gives you three enforcement levels:

- **Advisory** — warn but allow the apply.
- **Soft-mandatory** — block, but a privileged user can override.
- **Hard-mandatory** — block, no override possible.

The override hierarchy matters. Most policies should be soft-mandatory (so engineering can ship in a real emergency) but auditable (so the override shows up in a report).

---

## OPA / Conftest

**Open Policy Agent (OPA)** is the open-source alternative. It's not Terraform-specific — OPA is a general policy engine used for Kubernetes admission control, API authorization, and more. The Terraform-specific wrapper is called **Conftest**.

The same encryption rule in OPA's Rego language:

```rego
# policy/s3.rego

package terraform.s3

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket"
    resource.change.actions[_] == "create"
    not has_encryption(resource.address)
    msg := sprintf("S3 bucket %s must have encryption configured", [resource.address])
}

has_encryption(addr) {
    enc := input.resource_changes[_]
    enc.type == "aws_s3_bucket_server_side_encryption_configuration"
    enc.change.after.bucket == addr
}
```

You run it against the JSON output of `terraform plan`:

```bash
terraform plan -out=tfplan.binary
terraform show -json tfplan.binary > tfplan.json
conftest test --policy ./policy tfplan.json
```

In CI, this runs after `plan` and before `apply`. A failure blocks the apply.

---

## Sentinel vs OPA — picking one

| | Sentinel | OPA / Conftest |
|---|---|---|
| **License** | Commercial (TFC/TFE only) | Apache 2.0 |
| **Language** | Sentinel (HCL-like) | Rego |
| **Scope** | Terraform-only | Terraform + Kubernetes + APIs + everything |
| **Integration** | Native in TFC/TFE | DIY in your CI |
| **Learning curve** | Easy if you know HCL | Steeper (Rego is unusual) |

The pragmatic call:

- If you're already paying for HCP Terraform / Terraform Enterprise, use Sentinel. The integration is too tight to ignore.
- If you're on Atlantis, GitHub Actions, or any self-managed CI, use OPA / Conftest. Same outcome, no license cost, transferable skill.
- If your org also uses Kubernetes and you're already running OPA Gatekeeper there, definitely OPA — one policy engine across multiple platforms is a real win.

---

## Drift in the real world

Chapter 5 introduced scheduled `terraform plan` as a drift-detection mechanism. In a mature org, that signal feeds something that takes action.

The maturity ladder of drift response:

1. **Detect.** Scheduled `plan` produces an exit code or a JSON diff.
2. **Notify.** Alert sent to Slack, email, or a paging service. Most teams stop here.
3. **Triage.** Drift is auto-categorized — "tag drift" (low priority), "security group drift" (medium), "IAM drift" (high). Different categories route differently.
4. **Remediate.** Either auto-revert (re-apply the last known good state) or auto-import (acknowledge the change as intentional). This step is genuinely hard and most teams don't reach it.

Most painful drift incidents come from one of three sources: a colleague making a "quick fix" in the console, an out-of-band terraform run (someone else's laptop), or a CloudFormation/Pulumi stack stepping on a Terraform-managed resource. Solving the third one — figuring out who owns what — is half the battle.

> **Going deeper.** Spacelift and Terraform Cloud both offer drift detection as a UI feature. They run `plan` against your stacks on a schedule, surface the diff, and let you decide whether to revert or import. If you're outgrowing the homemade GitHub-Actions cron job, that's the upgrade path.

---

## Mature Terraform: what it actually looks like

A team running Terraform at scale typically has, in some form:

- **An internal module registry.** Either `terraform-aws-modules`-style public modules or a private registry. New projects start by composing existing modules, not by writing from scratch.
- **A platform team.** One small group owns the modules, the CI/CD, the policy library. They publish; product teams consume.
- **Layered policies.** Hygiene policies (tags, encryption) at the org level. Domain policies (network architecture) at the platform level. Application policies (specific resource limits) at the team level.
- **A clear "who can apply where" map.** Dev environments can be applied by any engineer. Staging requires team-lead approval. Prod requires a separate role assumption and is auditable.
- **Cost visibility.** Tags + AWS Cost Explorer + a dashboard. Engineers see what their changes cost before they ship them.
- **A definition of done for new infra.** Module exists, has tests (Terratest or similar), is documented, has policy coverage, has cost estimates.

You don't get there overnight. You get there by adding one of these things every quarter for two years.

---

## What to read next

You've finished a structured intro to Terraform on AWS. The next layers worth exploring:

- **Module testing.** [Terratest](https://terratest.gruntwork.io) for Go-based integration tests; **`terraform test`** (built-in since 1.6) for HCL-based unit tests. Both belong in any module that ships beyond one team.
- **Provider development.** If your company has internal APIs, writing a custom provider is more powerful than calling them via `null_resource` and shell scripts.
- **EKS-specific Terraform.** If you're heading toward Kubernetes, the EKS modules (and Karpenter, ALB controllers, etc.) are their own ecosystem.
- **The `terraform-aws-modules` GitHub org.** Not so much a tutorial as a reference. Read how they structure VPC, IAM, EKS — it's a master class in module design.
- **HashiCorp's policy library.** A good starting point for Sentinel patterns even if you eventually use OPA.

---

## What you should walk away from this chapter — and the series — with

- **Governance is the difference between Terraform working at five engineers and Terraform working at five hundred.** Conventions and policies aren't bureaucracy; they're how a tool stays usable at scale.
- **`default_tags` is the cheapest production win in all of Terraform.** Set it on day one.
- **Policy-as-code is the line between "we have rules" and "we have enforced rules."** Sentinel if you're on TFC; OPA otherwise.
- **Drift detection is non-negotiable** at any team size larger than two people.

And from the series as a whole, the three ideas worth carrying:

1. **Terraform's superpower is `plan`.** The diff before the change is the difference between IaC and click-ops with extra steps.
2. **State is the most important file in the system.** Treat it like a production database — encrypted, locked, versioned, restricted.
3. **The code is the source of truth.** Every divergence between your repo and reality is a bug to investigate, not a state to live with.

If you internalize those three, you're already ahead of most people running Terraform in production. The rest is practice.

---

*That's the series. If you build something with it, I'd love to know what — what worked, what didn't, what was missing. Infrastructure-as-Code is a craft that compounds over years, and the best way to learn it is to ship something real and live with it for a while. Go ship something real.*
