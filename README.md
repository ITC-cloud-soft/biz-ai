# Biz Assistant Framework

Packages `@dsh-bridge/*` (the framework was first called DSH Business Bridge; the package names keep that prefix). Customer-facing
name: Bizアシスタント.

A truly general-purpose framework that turns **any IT system** into an AI agent / AI assistant: an **existing business system**
(billing, inspections, HR, ... any IT system with its own employees, roles and login) becomes one that works with **DSH AI employees** — an AI assistant for every employee, working through IM
(Slack, LINE, Teams, WeCom, personal WeChat, Feishu, ...). A new system can be built on it the same way.

The business system stays the single source of record. It adds a bridge: a small HTTP protocol (Bridge v1), a manifest that
describes it, SNS linking on its own login, and recipient rules it decides itself. The framework provides the rest — the DSH
runtime and its IM channels, plugins that link employees' IM accounts (each employee links only their own, through the
organisation's bots or their own personal bots), call business tools with the employee's own delegated rights (read and propose
only — people decide), deliver notifications and approval cards **only to the people the business system names**, run automatic
tasks on business events (per-class or per-person delegation), send scheduled reports to the employee's own chat, and answer
questions from the business web's assistant panel; the guards on every path from the AI to IM; tests and a conformance suite.

The AI employee also has **the name and personality the company sets** (nickname, tone, company introduction — always signed as an
AI secretary, never able to change the rules), **long-term memory** (each employee's preferences and open matters, the organization's
procedures, recall of earlier conversations; personal data is never kept) and **answers how-to questions from the system's own
manual** with a link to the right screen (sections below).

It was extracted from ケアビリング (care-ai-native), which is its first user (`examples/care-billing/`: manifest and mapping only, no
business code).

What an existing system adds, item by item, and how each item is checked: [`docs/GUIDELINE.md`「既存の業務システムをつなぐ：チェックリスト」](docs/GUIDELINE.md#既存の業務システムをつなぐチェックリスト).

## Layout

| path | package | what |
|---|---|---|
| `packages/protocol` | `@dsh-bridge/protocol` | Bridge v1: OpenAPI, manifest / event JSON Schemas, validators, conformance suite, `bridge-validate` CLI |
| `packages/dsh-core` | `@dsh-bridge/dsh-core` | DSH side core: application registry (`bridge-apps` plugin), business API client, delegation cache, session keys, tools-sdk, app-switch, AI secretary framing, delivery classification |
| `packages/gateway` | `@dsh-bridge/gateway` | BFF → DSH authenticating gateway (`/dsh/*`, launch token, public webhook paths, RPC allow-list, supervise) |
| `packages/server-kit` | `@dsh-bridge/server-kit` | Node parts for implementing Bridge v1 in a business system |
| `packages/help` | `@dsh-bridge/help` | answering how-to questions on SNS from the business system's own manual: manual parsing, the index, CI checks against the screens, role-aware search with links |
| `packages/web-kit` | `@dsh-bridge/web-kit` | business web parts (SNS linking, the employee's own bots, organisation IM bots, notification preferences, platform labels, the AI employee's profile page `AiProfilePage`) |
| `packages/testing` | `@dsh-bridge/testing` | mock LLM / LINE / iLink / WeCom, isolated DSH home and process helpers |
| `plugins/identity` | `@dsh-bridge/plugin-identity` | DSH plugin `bridge-identity`: link codes, access check (linked employees only, group chats get a fixed guide), lookup per bot, shared-bot app switching, link guard on AI answers, public help sections for senders not linked yet |
| `plugins/tools` | `@dsh-bridge/plugin-tools` | `bridge-tools`: delegation gate, delegation classes and per-event delegations, tool modules (hand-written read / propose tools) |
| `plugins/events` | `@dsh-bridge/plugin-events` | `bridge-events`: event cursors per application, dispatch to the plugins and auto-tasks, manifest playbook deployment |
| `plugins/notify` | `@dsh-bridge/plugin-notify` | `bridge-notify`: deterministic notifications to the recipients the business system names, digests, quiet hours, AI secretary wording, scheduled reports and their guards |
| `plugins/approvals` | `@dsh-bridge/plugin-approvals` | `bridge-approvals`: approval cards, buttons and reply codes, one decision decides |
| `plugins/assistant` | `@dsh-bridge/plugin-assistant` | `bridge-assistant`: the business web's assistant panel (the employee's own rights through a ticket; panel title = the AI employee's nickname) |
| `plugins/memory` | `@dsh-bridge/plugin-memory` | `bridge-memory`: long-term memory — personal memory (the owner only), organization memory, conversation recall; personal data checked before saving (local + the business system's `/pii-scan`, fail closed), never in group chats |
| `plugins/persona` | `@dsh-bridge/plugin-persona` | `bridge-persona`: the AI employee's profile from the business system (`GET /bridge/v1/ai-profile`: nickname, tone, company introduction, personality, background) as a system prompt section after the fixed rules |
| `plugins/reader` | `@dsh-bridge/plugin-reader` | `bridge-reader`: scanned documents the business system could not read (images, PDFs without a text layer) — page images from `GET /bridge/v1/document-reads`, transcribed by the image-reading model one page per request (no conversation), the text back to `POST .../result` (`docs/DOCUMENT_READS.md`) |
| `profile/` | `@dsh-bridge/profile` | DSH product profile template, `install.mjs`, automatic task template format |
| `vendor/` | `@care/dsh-im`, `@care/dsh-auto-tasks`, `@care/dsh-proactive` | forks of the DSH IM / auto-tasks / proactive plugins (own npm setup, see each `FORK.md`) |
| `examples/` | | `equipment-inspection` (a sample business system on server-kit), `care-billing` (the first user's manifest) |
| `docs/` | | `GUIDELINE.md`, `ARCHITECTURE.md`, slides |

## Quick start

Node 22.19+ (24 tested), pnpm 10.

```sh
pnpm install
pnpm test                    # every workspace package (vendor/ excluded)
pnpm test:protocol           # or: test:core, test:gateway, test:testing, test:plugins, test:profile, test:examples
pnpm validate                # lint the OpenAPI and validate the bundled manifests

# end to end on a real DSH (dsh CLI installed globally, local PostgreSQL; mocks for the model and LINE)
FW_TEST_DATABASE_URL=postgres://<user>:<password>@127.0.0.1:5432/postgres pnpm run e2e

# a manifest of your own
node packages/protocol/bin/bridge-validate.mjs manifest my-app.manifest.yaml

# a DSH home with the profile template (never the personal ~/.dsh)
node profile/scripts/install.mjs --home .dsh-home-trial --skip-install
```

The forks keep their own `package-lock.json`: `cd vendor/dsh-im && npm ci && npm test` (likewise `dsh-auto-tasks`, `dsh-proactive`).

Next: `docs/GUIDELINE.md` (how to connect a business system), `docs/ARCHITECTURE.md` (layers, event flow, personal bots,
recipient guarantees, conversation isolation, safety promises), `packages/protocol/README.md` (the protocol and the conformance suite).

The outbound switches are closed by default in `profile/template` (`docs/GUIDELINE.md` d.8): the plugin and fork defaults keep the
upstream behaviour for some of them, so the template writes the product values and a system opts in to an open setting only by changing
that line explicitly. `install.mjs` refuses fixed delivery targets (`--auto-task-session / --auto-task-bot / --auto-task-target`), and
server-kit applies the personal-bot owner rule at lookup and issues per-event delegations only through `hooks.eventDelegations`.

## Answering how-to questions on SNS (the manual)

Employees also ask the AI secretary how to use the system ("where do I enter the monitoring?"). The framework answers **from the business
system's own manual** — never from the model's guesses — with **the URL of the right screen for the asker's role**:

- the manual (Markdown, one section per screen) is checked against the screens in CI (paths are routes, every screen has a section, the
  roles written match the guards, links resolve) and built into an index (`@dsh-bridge/help`);
- the business system searches it per role (`server-kit` `help` option → `GET /bridge/v1/help/*`, optional in Bridge v1): a screen the
  asker cannot open has no URL, only whom to ask;
- the DSH generates the manual search tool from the manifest's `help.tool` (`@dsh-bridge/dsh-core` help-tool); the AI answers in the
  【ご案内】 frame and copies only the URLs it was given; bridge-identity drops any link that is not one of the manifest's `web.routes`
  before the answer leaves, and answers a sender that is not linked yet from the public sections (sign-in, SNS linking) without the AI.

How to add it: [`packages/help/README.md`](packages/help/README.md), `docs/GUIDELINE.md` (checklist #9, b.8). The sample system has a
small manual (`examples/equipment-inspection/manual`); ケアビリング's has 164 sections.

## The AI employee's profile and long-term memory

- **Profile** (`plugins/persona`, `docs/AI_EMPLOYEE_PROFILE.md`): the administrator sets the AI employee's nickname (e.g. さくら),
  first person and tone, company introduction, personality, background, speaking examples and per-AI-employee overrides on the business
  web (web-kit `AiProfilePage`). The business system is the source of record (server-kit: `GET /bridge/v1/ai-profile` with an etag,
  admin `GET / PUT /bridge/v1/admin/ai-profile` and restore, versions and audit with the version number only; checked by the protocol's
  `validateAiProfile`: rule-override wording and personal data are refused). The DSH reads it at start-up and every 60 s (dsh-core
  holder); bridge-persona puts the fixed rules first, then the persona as settings that cannot override them, then the company as
  reference, fixed per conversation. Signatures become 「— <呼び名>（<アプリ名> AI 秘書）」 at once. External connectors (P2・P3): the
  company's own and third-party APIs registered by an administrator, run by the business system (allowed https hosts, sealed
  secrets, allow-listed response fields); the AI reads as the employee and proposes writes, a person approves, rules react to events / cron.
- **Long-term memory** (`plugins/memory`): personal memory (only the owner), organization memory, conversation recall (90 days);
  a little of it is given at the start of a conversation as reference (not instructions); personal data is checked before saving
  (local screen + the business system's `POST /bridge/v1/pii-scan`, fail closed); never in group chats; business data is never kept
  (always read with the tools). In the profile template by default; an application renames tools and storage with `createMemoryPlugin`.

## Docs

Written in Japanese (each starts with a short English summary).

| document | for | what |
|---|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | everyone | what the framework is (business plane = SoR, AI plane = DSH), what a system adds, layers L1–L5, the event flow, identity, personal bots and delegation (classes, per event), multi-application DSH and per-application sessions, the recipient guarantees (who decides, the guards on every outbound path, fail-closed settings), safety and privacy promises, the forks |
| [`docs/GUIDELINE.md`](docs/GUIDELINE.md) | developers | the integration checklist, quick start, connecting a business system step by step, extension points, MUST / SHOULD rules (AI secretary wording, per-platform notes, recipients, group chats, unattended delegation, outbound screening, config switches, personal bots), testing, versioning, FAQ, ケアビリング as the reference |
| [`docs/slides/biz-assistant-framework.pptx`](docs/slides/biz-assistant-framework.pptx) ([PDF](docs/slides/biz-assistant-framework.pdf)) | technical audience | the framework in 31 slides with speaker notes (generated from [`docs/slides/src`](docs/slides/src/README.md)) |
| [`docs/slides/marketing/biz-assistant-for-executives.pptx`](docs/slides/marketing/biz-assistant-for-executives.pptx) ([PDF](docs/slides/marketing/biz-assistant-for-executives.pdf)) | executives | Bizアシスタント: any IT system as an AI agent / AI assistant, AI employees with the company's name and personality in everyone's chat, 23 slides (generated from [`docs/slides/marketing/src`](docs/slides/marketing/src/README.md)) |
| [`docs/slides/manual/biz-assistant-framework-technical-guide.md`](docs/slides/manual/biz-assistant-framework-technical-guide.md) ([PPTX](docs/slides/manual/biz-assistant-framework-technical-guide.pptx) / [PDF](docs/slides/manual/biz-assistant-framework-technical-guide.pdf)) | customer engineers | the technical guide (Japanese, 50 slides + a detailed Markdown version, no internal names): architecture, Bridge v1 and the manifest, the main flows, the safety promises, connecting / building a system, quality and status — also the draft for the official web site |
| [`docs/skill/biz-assistant-integration`](docs/skill/README.md) | AI coding agents | a skill (Claude Code `SKILL.md` + references) that walks an agent through bringing the framework into a new or an existing business system: assessment, plan, manifest, hooks, events, conformance 52 / 52, DSH profile, web and BFF, automatic tasks, completion checks |
| [`docs/AI_EMPLOYEE_PROFILE.md`](docs/AI_EMPLOYEE_PROFILE.md) | developers | the AI employee's profile (P1) and the external connectors / rules (P2・P3), implemented |
| [`docs/ASSISTANT_ATTACHMENTS.md`](docs/ASSISTANT_ATTACHMENTS.md) | developers | file attachments and Markdown answers in the assistant panel (proposal, being implemented) |
| [`packages/protocol/README.md`](packages/protocol/README.md) | system integrators | Bridge v1, the manifest, the conformance suite and its 52 checks |
| [`examples/equipment-inspection`](examples/equipment-inspection/README.md) · [`examples/care-billing`](examples/care-billing/README.md) | developers | a sample system on server-kit (52 / 52) · the first user's manifest, registry entry and mapping table |

## License

[Apache License 2.0](LICENSE) — see also [`NOTICE`](NOTICE). The forks in `vendor/` keep their upstream licenses (MIT).

Public repository: https://github.com/ITC-cloud-soft/biz-ai — questions in GitHub Discussions, bugs in GitHub Issues.
