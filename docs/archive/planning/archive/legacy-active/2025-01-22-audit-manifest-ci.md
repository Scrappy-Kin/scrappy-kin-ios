# Audit Manifest + SHA-Pinned Prompt (Active Spec)

## Goal
Provide a zero-trust, reproducible audit prompt that references immutable raw GitHub URLs pinned to a commit SHA, without requiring users to run git commands.

## Non-goals
- Auto-committing manifests in CI (keep CI light).
- Auditing the entire repo (explicitly scope to key files).

## Scope
- Generate a JSON manifest with repo + SHA + key file paths + derived raw URLs.
- Update the in-app audit prompt to use the manifest.
- Add a CI check that only requires regeneration when key files change.

## Manifest shape (MVP)
- `repo`
- `sha`
- `generated_at`
- `key_files: [{ path, purpose }]`
- `raw_urls: [{ path, url }]`
- `coverage.note` (explicitly “key files only; not exhaustive”)

## Update policy
- Regenerate the manifest only when key files change.
- CI should fail with a clear instruction when regeneration is required.

## Implementation notes
- Resolve SHA from `GITHUB_SHA` in CI, otherwise `git rev-parse HEAD` locally.
- Verify each key file exists before writing the manifest.
- In `--check` mode, compare `git diff --name-only <manifest_sha> HEAD -- <key files>` and fail only if changes are detected.
- Prompt must include the manifest SHA, key file raw URLs, and a strict scope boundary.

## Acceptance
- Manifest exists on disk and is referenced by the audit prompt.
- Prompt contains SHA-pinned raw URLs and scope boundary.
- CI check fails only when key files change without manifest regeneration.
- Instructions are clear on how to fix failures.
