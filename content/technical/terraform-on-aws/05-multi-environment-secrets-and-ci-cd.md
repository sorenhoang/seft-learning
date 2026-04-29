---
title: "Multi-Environment, Secrets, and CI/CD with Atlantis"
order: 5
tags: ["terraform", "aws", "ci-cd", "atlantis", "secrets", "github"]
date: "2026-04-29"
draft: false
lang: "en"
---

By chapter 4, the running example is well-organized — modules separate the network, compute, and storage concerns. But it still has two problems that make it useless for a real team: it lives in a single directory (so there's no way to run dev and prod from the same repo), and `apply` happens from a human's laptop (so there's no review, no audit, no automation).

This chapter fixes both. We'll structure the repo for multiple environments, talk about how to handle secrets without leaking them into state, and wire up a real CI/CD flow with **Atlantis** — the open-source GitOps tool that turns pull requests into the unit of infrastructure change.

---

## Why one config isn't enough

When you have a single `main.tf` and one S3 state file, every change goes to the same target. That's fine for a personal project. The moment you have a real environment story — dev for experimentation, staging for testing, prod for customers — you need three things:

1. **Three separate state files.** Mixing dev and prod in one state file means a typo can affect both.
2. **Three different sets of inputs.** Dev runs t3.micro instances; prod runs t3.large.
3. **Three different blast radii.** A bad `apply` in dev should be embarrassing; a bad `apply` in prod should be impossible without explicit approval.

There are three popular ways to achieve this in Terraform:

- **Workspaces** — one config, multiple state files via `terraform workspace`.
- **Folder-per-environment** — one folder per env, each with its own backend config and `*.tfvars`.
- **Terragrunt** — a third-party wrapper that adds DRY orchestration on top of folder-per-environment.

We're using **folder-per-environment** in this series. It's the most explicit, the easiest to reason about, and it doesn't require a second tool. Workspaces have real limitations — the list of workspaces isn't visible in the repo, and switching is a stateful command instead of `cd`. Terragrunt is excellent for large orgs with 30+ environments, but it's an additional learning curve we don't need yet.

> **Going deeper.** Workspaces aren't useless — they're a fine fit for "one app, multiple regions" or "one config, multiple feature branches." The reason they fall down for environment separation is that prod and dev usually need different IAM credentials, different account IDs, different module versions — and workspaces don't give you a clean way to vary those. Folder-per-env makes it textually obvious: dev/ uses one role, prod/ uses another.

---

## Folder-per-environment layout

Restructure the repo so each environment is a directory:

```
terraform-running-example/
├── modules/
│   ├── networking/
│   ├── compute/
│   └── storage/
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── backend.tf
    │   └── terraform.tfvars
    ├── staging/
    │   ├── main.tf
    │   ├── backend.tf
    │   └── terraform.tfvars
    └── prod/
        ├── main.tf
        ├── backend.tf
        └── terraform.tfvars
```

Each environment directory has:

- **`main.tf`** — the same module calls for all environments. This is the bit that should stay nearly identical across folders.
- **`backend.tf`** — the S3 backend block, with a *different state key per environment*.
- **`terraform.tfvars`** — environment-specific variable values (instance sizes, AZ counts, anything that varies).

The `main.tf` files end up looking 90% the same:

```hcl
# environments/dev/main.tf

module "networking" {
  source = "../../modules/networking"

  availability_zone = var.availability_zone
  tags              = { Environment = var.environment }
}

module "compute" {
  source = "../../modules/compute"

  vpc_id        = module.networking.vpc_id
  subnet_id     = module.networking.public_subnet_id
  instance_type = var.instance_type

  tags = { Environment = var.environment }
}

module "storage" {
  source = "../../modules/storage"

  bucket_name = "running-example-${var.environment}-yourname-2026"
  tags        = { Environment = var.environment }
}
```

```hcl
# environments/dev/backend.tf

terraform {
  backend "s3" {
    bucket       = "tf-state-yourname-2026"
    key          = "running-example/dev/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

```hcl
# environments/dev/terraform.tfvars

environment       = "dev"
availability_zone = "us-east-1a"
instance_type     = "t3.micro"
```

The repetition between dev/staging/prod feels uncomfortable, and it is. Some duplication is the price of explicitness. If it grows to be too much, that's the moment Terragrunt earns its keep — but typically it doesn't, because most of the variation lives in `terraform.tfvars`, which is the file that's *supposed* to differ.

---

## The secrets problem

Here's a temptation that has bitten everyone learning Terraform exactly once. You need to set a database password. The "obvious" thing is:

```hcl
# DON'T DO THIS

variable "db_password" {
  type    = string
  default = "supersecret123"
}
```

This is wrong for two reasons:

1. **It commits to git.** Anyone with read access to the repo has the password.
2. **It ends up in state.** Even if you used a `.tfvars` file in `.gitignore`, the value gets baked into the state file, which lives in S3 — and your state-bucket IAM policies are probably broader than your secrets-bucket policies.

The right pattern is **never store secrets in Terraform**. Store them in AWS Secrets Manager or SSM Parameter Store, and have Terraform *reference* them by ARN.

```hcl
# Don't pass the secret in. Look it up.

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "running-example/db-password"
}

resource "aws_db_instance" "main" {
  # ...
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
}
```

This still puts the password into state at apply time, but it's at least pulled from a single source of truth that has its own audit trail and rotation. For higher-stakes secrets, the more disciplined pattern is to **provision the secret outside Terraform entirely** — via the AWS console, a deployment pipeline, or a separate secrets-management service — and have Terraform only reference the ARN, never the value.

The `sensitive = true` flag is the secondary defense:

```hcl
variable "api_key" {
  type      = string
  sensitive = true
}
```

This stops Terraform from printing the value in plan/apply output. It does **not** keep it out of state. It is a UI safety net, not a security boundary.

> **Going deeper.** State files contain provider-injected attribute data. When you create an RDS instance with a password, that password is in state. When you create an IAM access key, the secret is in state. This is why state encryption + tight IAM on the state bucket is non-negotiable — the bucket holds secrets you may not realize you put there.

---

## CI/CD: the goal

Stop running `terraform apply` from a laptop. Period. This isn't paranoia — it's that laptops have stale code, stale credentials, and zero audit trail. Once a team is bigger than two people, "I'll just apply it locally" becomes the most expensive sentence in DevOps.

What we want instead:

1. Every infrastructure change is a **pull request**.
2. The PR triggers a **`terraform plan`** automatically and posts the output as a comment.
3. A reviewer reads the plan, comments, approves.
4. A maintainer **comments `atlantis apply`** on the PR.
5. Atlantis runs the apply in a controlled environment (its own VM, with its own role) and posts the result.
6. The PR is merged.

This pattern — pull-request-as-the-unit-of-change, applied by automation — is what people mean by **GitOps for Terraform**.

---

## Atlantis vs the alternatives

| Tool | Open-source | You run it | Best for |
|---|---|---|---|
| **Atlantis** | Yes | Yes (a small server in your infra) | Teams that want GitOps with full control |
| **GitHub Actions** | Free for public, paid for private | GitHub | Simple workflows; no native locking-aware coordination |
| **Spacelift / env0** | No (SaaS) | Vendor | Larger teams, native drift, policy-as-code UI |
| **Terraform Cloud (HCP Terraform)** | Free tier | HashiCorp | Teams already using HashiCorp Vault/etc. |

We use Atlantis here because it's open-source, well-understood, and once you've run Atlantis you understand what the managed alternatives are wrapping around.

---

## A minimal Atlantis setup

Atlantis is a single Go binary. You typically run it on an EC2 instance or in a small ECS service. It exposes a webhook URL that your GitHub repo points to.

The configuration lives in `atlantis.yaml` at the root of the repo:

```yaml
version: 3

projects:
  - name: dev
    dir: environments/dev
    workflow: standard
    autoplan:
      when_modified: ["*.tf", "../../modules/**/*.tf"]
      enabled: true

  - name: staging
    dir: environments/staging
    workflow: standard
    autoplan:
      when_modified: ["*.tf", "../../modules/**/*.tf"]
      enabled: true

  - name: prod
    dir: environments/prod
    workflow: standard
    autoplan:
      when_modified: ["*.tf", "../../modules/**/*.tf"]
      enabled: true
    apply_requirements: [approved]

workflows:
  standard:
    plan:
      steps: [init, plan]
    apply:
      steps: [apply]
```

The prod project uses the same `standard` workflow as the others — the difference is the project-level `apply_requirements: [approved]`, which tells Atlantis to refuse apply unless the PR has been approved on GitHub. Different workflows are only worth defining when the *steps* genuinely differ (e.g., prod runs `conftest test` before apply); approval gating on its own is a project-level concern, not a workflow concern.

The flow on a pull request:

1. You change `environments/dev/main.tf` and open a PR.
2. Atlantis sees the change, runs `terraform plan` in `environments/dev`, posts the output as a comment.
3. A reviewer reads the plan and approves the PR.
4. You comment `atlantis apply -p dev`. Atlantis runs the apply.
5. You merge.

For prod, the `apply_requirements: [approved]` line is the guardrail — Atlantis refuses to apply unless the PR has been approved. This is the simplest possible "no production change without review" enforcement.

> **Going deeper.** Real-world Atlantis setups usually layer in more: a separate IAM role for prod (assumed only when the prod project runs), required-status-checks on the PR (e.g. tflint, conftest), and Slack notifications. The `atlantis.yaml` above is the spine — production teams add muscle on top.

---

## Drift detection

Once `apply`s only happen via Atlantis, the remaining failure mode is **drift** — someone goes into the AWS console and changes something out-of-band. Terraform doesn't know; the state file says one thing, reality says another. The next legitimate `apply` will try to "fix" the drift, sometimes destructively.

The cheap, effective drift detection: **run `terraform plan` on a schedule and alert if there's any drift.**

A GitHub Actions workflow that runs nightly:

```yaml
# .github/workflows/drift-detect.yml

name: Drift Detection
on:
  schedule:
    - cron: '0 8 * * *'  # daily at 08:00 UTC

jobs:
  detect:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        env: [dev, staging, prod]
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.10.x
      - name: Plan
        working-directory: environments/${{ matrix.env }}
        run: |
          terraform init
          terraform plan -detailed-exitcode -lock=false
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.READONLY_AWS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.READONLY_AWS_SECRET }}
      - name: Notify on drift
        if: failure()
        run: |
          # post to Slack, file a GitHub issue, page someone — your call
          echo "Drift detected in ${{ matrix.env }}"
```

`-detailed-exitcode` makes `terraform plan` exit with code 2 when there's drift, so the workflow can branch on it. Use a **read-only** AWS role here — drift detection should never have apply permissions.

Managed platforms like Spacelift and HCP Terraform offer drift detection as a native feature with prettier UIs. This rolled-by-hand version is the unmanaged equivalent: cheap, ugly, effective.

---

## What you should walk away with

- **Folder-per-environment is the boring, correct default.** Workspaces are fine for niche cases; Terragrunt earns its keep at scale; folders are the universal middle ground.
- **Never store secrets in Terraform.** Reference them via Secrets Manager or SSM. State files are not a secrets store.
- **Stop applying from laptops.** Pull-request-driven applies via Atlantis (or equivalent) is the line between "small team" and "team with discipline."
- **Drift detection is a scheduled `terraform plan` away.** You don't need a vendor for this; you need a cron job.

In chapter 6 we close the series by zooming out: what does mature Terraform usage look like? Policy-as-code, naming conventions, the role of `default_tags`, tflint, and how to think about scaling Terraform from one team to many.

---

*Next up — Chapter 6: Governance and the Long Game. We finish the series by looking at policy-as-code (Sentinel vs OPA), the production hygiene patterns mature teams converge on, and what to read next.*
