---
name: git-workflow
description: Standardize git commit messages, branch naming, semantic versioning, and changelog generation. Trigger when writing commit messages, preparing release notes, or managing git history.
---

# Git Workflow Skill Instructions

When performing Git operations, drafting commit messages, or structuring releases, apply these standards:

## 1. Commit Message Structure
- Use Conventional Commits format (`type(scope): concise description`):
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation changes
  - `style`: Formatting or aesthetic UI updates
  - `refactor`: Code changes without behavior modification
  - `test`: Adding or updating test suites
  - `chore`: Build tools or configuration updates
- Keep the commit title concise (under 72 characters) and imperative ("add feature" not "added feature").

## 2. Repository Safety
- Commit work only when explicitly requested by the user.
- Verify status with `git status` to avoid committing temporary files, scratch scripts, or `.env.local` secrets.
- Maintain a clean working directory and clean diffs.
