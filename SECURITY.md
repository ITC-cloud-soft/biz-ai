# Security policy

**English** · [日本語](#日本語)

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Report it privately through GitHub: **Security → Report a vulnerability** on this repository
([direct link](https://github.com/ITC-cloud-soft/biz-ai/security/advisories/new)). Include what you found, how to reproduce it
and what an attacker could do with it.

We aim to acknowledge a report within 5 business days, agree on a fix and a disclosure date with you, and credit you in the
advisory unless you prefer not to be named.

## Supported versions

The `main` branch and the latest release. Fixes are not back-ported to older releases.

## What is in scope

The framework code in this repository: the Bridge v1 protocol and server-kit, the DSH plugins (`plugins/*`), the gateway, the
profile, web-kit and the example systems. Especially welcome are reports that break one of the framework's promises:

- the AI confirming, approving or paying anything, or calling a write that is not a proposal;
- an employee reading data the business system would not show them on its own screens;
- personal data leaking into events, notifications, logs or memory.

Out of scope: DeepSeek Harness itself and other upstream projects (report those to their maintainers), and deployments run by
third parties.

---

## 日本語

セキュリティの問題は、**公開の issue に書かないでください。**

このリポジトリの **Security → Report a vulnerability**（[直接リンク](https://github.com/ITC-cloud-soft/biz-ai/security/advisories/new)）から、
非公開で報告してください。見つけた内容、再現手順、攻撃者に何ができるかを書いてください。

5 営業日以内の受領連絡を目標にしています。修正と公開の日程はあなたと相談して決め、希望されない場合を除いて advisory にお名前を記載します。

対象は `main` ブランチと最新のリリースです。特に、次のような「フレームワークの約束」を破る報告を歓迎します。

- AI が確定・承認・支払いをしてしまう、提案以外の書き込みを呼べてしまう
- 業務画面では見られないデータを、AI 経由で読めてしまう
- イベント・通知・ログ・記憶に個人情報が入ってしまう

DeepSeek Harness 本体などの上流プロジェクトは対象外です（それぞれの開発元に報告してください）。
