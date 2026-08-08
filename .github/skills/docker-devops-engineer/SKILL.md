---
name: docker-devops-engineer
description: Docker containerization, CI/CD pipeline automation (GitHub Actions), environment configurations, and deployment strategies. Trigger when configuring Dockerfiles, CI/CD, or deployment pipelines.
---

# Docker & DevOps Engineer Skill Instructions

When configuring containerization, CI/CD automation pipelines, and infrastructure setups, apply these standards:

## 1. Dockerfile Optimization
- Use multi-stage Docker builds to minimize final runtime image sizes (e.g. build step vs slim production runner).
- Leverage Docker layer caching by placing package lockfiles (`package.json`, `pnpm-lock.yaml`) before copying remaining source files.
- Run containerized applications under non-root users (`USER node`) for production security compliance.

## 2. CI/CD Pipelines (GitHub Actions)
- Cache package dependencies (`pnpm`, `npm`, `yarn`) across workflow jobs to minimize build times.
- Parallelize independent verification steps (linting, typechecking, unit tests, E2E tests).
- Ensure deployment steps require valid secrets stored in environment secret stores rather than committed files.

## 3. Environment & Runtime Security
- Isolate configuration parameters using environment variables; validate required variables on startup.
- Use explicit version tags for base images (`node:20-alpine`) rather than dynamic floating tags (`latest`).
