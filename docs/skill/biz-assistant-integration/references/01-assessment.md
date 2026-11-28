# 01 Assessment: what to add, and which path to take

Source of truth: `docs/GUIDELINE.en.md` "Connecting an existing business system: checklist", b.10 (external mode), `docs/EXTERNAL_LAYER_FEASIBILITY.md`.

## 1. The 13-item assessment table

Read the target system and, for each item, judge it as **present (usable as is) / alias (something with the same function exists) / add (missing)**, and write down the evidence (files, functions, tables).
Copy the result into the table in the plan (`templates/integration-plan.md`).

| # | What to add to the business system | Category | What to check (in the target system) |
|---|---|---|---|
| 1 | An HTTP API that reads business data, and an entry point that receives the AI's proposals | Required | Are there GET endpoints for the lists and details you want the AI to read? If screens and business logic are fused (server rendering only, desktop app, direct DB access), a read API must be added |
| 2 | manifest | Required | Can the roles, business changes and things to notify be written down (no code changes) |
| 3 | A screen for the person's own chat link (using **the system's own login**) | Required | Can the BFF verify the existing login and session (`authenticate(req)` → `{ user: { id, role }, sessionId }`)? If the design cannot be verified from outside, add an entry point that verifies it. **Do not build a separate identity check** |
| 4 | Rules by which the business system decides notification recipients | Required | Is "who to notify" in the code, or only in human operating practice? Can assignees, affiliations and scopes be looked up? Can the web authorization functions be reused? |
| 5 | Record state changes as events in the same transaction (outbox) | Required | Where the state-changing processes are, and how transactions are opened. Can one line be added there? |
| 6 | Employees and roles (including active / inactive) can be looked up | Required | The employee table and the role table |
| 7 | Approval rules in a single function | Required (for 52 / 52) | Are approval rules scattered across screen code? If so, consolidate them into one function. Even a business without approvals keeps a minimal single kind |
| 8 | Whether a web session is still alive can be checked | Required (for S4) | The session table / store |
| 9 | An employee manual (1 screen = 1 section) | Recommended | Whether a manual already exists, and whether the table of screen routes (router and guards) can be extracted |
| 10 | Personal-data scanning based on the name roster (`hooks.piiScan`) | Recommended (effectively required for systems that hold names) | Name tables for employees, customers, business partners, etc. |
| 11 | Editing the AI employee's profile | Recommended | Built in with server-kit. If self-implemented, a version table and an admin screen |
| 12 | Scheduled report (counts only) | Required (for 52 / 52) | Can 1–4 sections at the level of "today's counts" be defined? |
| 13 | External connectors (connections, operations, rules) | Optional | Do you want the AI to use your company's other APIs or third-party APIs? |

## 2. Estimation tips

- 1 (read API) and 3 (login) touch the foundations of the design, so the amount to add varies greatly by system. Estimate them first.
- 5 scales with "the number of state-changing processes". Only the processes related to the first business are needed.
- 7 and 12 are kept in minimal form even if the business does not use them (to pass conformance with no skips).
- Registration of personal bots (employees connecting their own bots) and the ownership rules are built into server-kit by default. If you use them, the BFF needs RPCs for the person themself (`07-web-and-bff.md`).
- Estimate in two parts: the implementation by the coding agent up to strict validation and 52 / 52, and the work only people can do (the decisions in SKILL.md section 4,
  review of the diff, confirmation in a real chat and with a real model, on-site checks). The second part usually takes longer; plan around it.
- **Defects of the existing system found while reading it** (unrelated to AI, for example: an applicant can approve their own request, a fixed token in the code,
  bank account numbers in a list response): list them separately in the plan with the evidence, and ask the user whether to fix them in this work.
  The bridge reuses the system's authorization and data access, so an authorization defect would also apply to the AI's reads, recipients and approvals.

## 3. Choosing the path

| Result | Path |
|---|---|
| Node.js, code may be changed | Mount server-kit on the existing server |
| APIs with the same function already exist | Mount `/bridge/v1` as aliases and add only the missing items |
| Not Node.js | Implement `bridge-v1.yaml` and verify with conformance |
| Code must not be changed | Judge external mode (trial) by the 4 capabilities below |
| Too much to add | Build new (`02-new-system.md`) / move businesses over one at a time |

### The 4 capabilities for external mode (GUIDELINE b.10)

| Capability | When missing |
|---|---|
| Login can be verified from outside (an OIDC / SAML IdP, or an entry point that returns "who this session belongs to") | Item 3 cannot be met, so external mode cannot be used |
| APIs can be called as the person (per-user OAuth, token exchange [RFC 8693], etc.) | Limit reads to what is determined by role alone; do not use approvals or writes |
| Changes are notified (a webhook that sends after commit, carries a change ID, retries until 2xx, is signed and can be re-fetched; or CDC) | Events that need accuracy, such as approvals, cannot be emitted (polling is for status notices only) |
| Approval and write APIs | Adopting proposals and approving in chat are not possible |

- Type A (all 4 present): external mode can meet every item.
- Type B (APIs exist but cannot be called as the person / no change notification): status notices, scheduled reports and read questions only. If approvals cannot be met, it does not reach 52 / 52.
- Type C (screens only): do not use external mode. Add APIs or build new.

External mode is a **trial** (before a PoC on a real system). If you adopt it, tell the user so, and do not change the release conditions (52 / 52, no skips).

## 4. Ask early: who accepts each AI proposal kind

For every proposal kind (`hooks.proposalKinds`), ask the user **who may accept or reject it**, and record the answer in the plan (section 2).
Ask it during the assessment, not in the middle of the implementation: the kit limits the possible answers. Tell the user these facts with the question
(source of truth: `packages/server-kit/src/routes/misc.mjs`, `src/app.mjs` `roles`, `packages/protocol/conformance/checks/proposals.mjs`).

| Kit fact | What it means for the design |
|---|---|
| Only a **human session** whose role is in `roles.proposalReviewers` can accept or reject (`POST /bridge/v1/proposals/{id}/accept` / `reject`). A delegation (the AI acting for an employee) and the service get 403 (conformance PR2). | A proposal cannot be accepted by the employee it was made for (`forUserId`): not from chat, and not on the web unless that employee's role is a reviewer role. "The employee confirms the AI's suggestion themself" is not a proposal; make it an ordinary web action of that employee. Conversely, the kit does not stop a reviewer from accepting a proposal made for themself: refuse it in `apply` if that must not happen (`proposal.forUserId === String(actor.id)`). |
| `roles.proposalReviewers` is **one list for all kinds** (default: the report readers). There is no per-kind reviewer setting. | Per-kind rules ("only a manager of the same department accepts `request_withdraw`", "only admin accepts `approval_reminder`") go in that kind's `apply(payload, actor, ctx, proposal)`: check `actor` and throw (`fail(403, '…')` from server-kit). The kit's transaction rolls back and the proposal stays `pending_review`. **Rejecting does not call `apply`**: any reviewer can reject a proposal of any kind. If rejecting must be limited too, hide the reject button in the web screen for those people and tell the user that the API still allows it. |
| A reviewer's `GET /bridge/v1/proposals` lists **every** proposal of every kind and department (id, kind, payload, `forUserId`); other employees see only the proposals made for them. | Putting an ordinary role into the reviewers shows those employees other people's and other departments' proposal IDs, kinds and payloads. Keep payloads to IDs, dates and counts (no amounts, names or free text), and narrow the list in the web screen if needed (the API does not). |
| A proposal's scope must match the proposing role's **read scope**. Conformance PR1 / PR2 call `proposalSample()` **before** the delegated employee exists (`newEmployee(role)` creates and links a fresh employee afterwards). | A `validate` that accepts only "the employee's own records" fails PR1 / PR2. Let the role propose on what its read tools can see (for example, a manager on the department's requests), and make the sample a record inside that scope that does not depend on the delegated employee. |

## 5. Assessment output

- The 13-item table (judgment, evidence, rough amount to add)
- The chosen path and the reason
- The one business to handle first
- A list of things for humans to decide (section 4 of SKILL.md), with recommendations, including who accepts each proposal kind (section 4 above)
