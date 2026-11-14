# Skills

Step-by-step guides (skills) for AI coding agents such as Claude Code to read.

| skill | What it does |
|---|---|
| [`biz-assistant-integration`](biz-assistant-integration/SKILL.md) | Brings the Biz Assistant Framework into a business system you are newly building or into an existing business system (assessment → plan → manifest, hooks and events → conformance 52 / 52 → DSH profile → business web app and BFF → automatic tasks → definition of done) |

## Usage

Prerequisite: you can read this repository (https://github.com/ITC-cloud-soft/biz-ai). The skill treats the repository's documents (`docs/GUIDELINE.en.md` (also in Japanese, the original: `docs/GUIDELINE.md`, and Chinese: `docs/GUIDELINE.zh-CN.md`) and others) as the source of truth.

To use it with Claude Code, copy the whole folder to a skills location:

```sh
# personal use (all projects)
cp -r docs/skill/biz-assistant-integration ~/.claude/skills/
# use in the repository of the target business system (shared with the team)
cp -r <framework>/docs/skill/biz-assistant-integration <business-system>/.claude/skills/
```

Then ask for something like "add the Biz Assistant to this business system" or "connect the Biz Assistant Framework to our existing system", and the skill is loaded.
With other agents, have them read `SKILL.md` first and `references/` as needed.

## Layout

```
biz-assistant-integration/
  SKILL.md                     entry point: choosing a path, how to proceed, rules to keep, what the user decides
  references/
    01-assessment.md           assessment of an existing system (13 items, the 4 capabilities for external mode)
    02-new-system.md           building a new system (location and dependencies, file shape)
    03-existing-system.md      connecting an existing system (server-kit, aliases, other languages, external mode)
    04-manifest.md             writing and validating the manifest
    05-business-side.md        hooks, events, recipients, approvals, proposals, reports
    06-dsh-profile.md          DSH profile, outbound settings, automatic tasks
    07-web-and-bff.md          business web app screens and BFF rules
    08-optional-features.md    manual, memory, profile, attachments, external connectors, documents
    09-rules.md                summary of MUST / SHOULD
    10-verification.md         conformance, definition of done, final checklist
  templates/
    integration-plan.md        integration plan template
```

## Maintenance

- The skill is a summary of and a route through `docs/GUIDELINE.en.md`. When you change the GUIDELINE, the protocol or the profile template, update the matching `references/` too (check commands, flags and file paths against the real ones).
- Examples are fictional (order management and the like). Do not write internal environment names, host names, customer names or secret values.
