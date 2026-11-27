# Contributing to the Biz Assistant Framework

**English** · [日本語](#日本語)

Thank you for looking. Questions, bug reports, documentation fixes and new example systems are all welcome.

## Where to start

| you want to | go to |
|---|---|
| ask how to do something, or show what you built | [Discussions](https://github.com/ITC-cloud-soft/biz-ai/discussions) |
| report a bug | [a bug report](https://github.com/ITC-cloud-soft/biz-ai/issues/new?template=bug.yml) |
| connect your own business system and get stuck | [「自分のシステムにつなぎたい」](https://github.com/ITC-cloud-soft/biz-ai/issues/new?template=connect.yml) |
| pick something small to fix | issues labelled [`good first issue`](https://github.com/ITC-cloud-soft/biz-ai/labels/good%20first%20issue) |
| report a vulnerability | **not an issue** — see [SECURITY.md](SECURITY.md) |

## Set up

Node 22.19+, pnpm 10 and Docker (Docker only for the demo's throwaway PostgreSQL; see below for running without it).

```sh
git clone https://github.com/ITC-cloud-soft/biz-ai.git && cd biz-ai
pnpm install
pnpm test        # every package, plugin and example
pnpm validate    # manifests and the Bridge v1 contract
pnpm demo        # the end-to-end demo on a real DSH with a scripted model and a mock LINE
```

No Docker: point the demo at any PostgreSQL you have (only its server and credentials are used; a temporary database is created and
dropped): `FW_TEST_DATABASE_URL=postgres://<user>:<password>@127.0.0.1:5432/postgres pnpm demo`.
No local setup at all: open the repository in GitHub Codespaces — the dev container starts PostgreSQL for you.

## The rules every change keeps

These are the framework's promises. A change that breaks one will not be merged, however useful it is.

1. **The AI never confirms, approves or pays.** Its only "write" is a proposal a person accepts. Enforced in code and
   configuration, not in prompts.
2. **The business system decides who sees what and who is told** — the same check as its own screens. The AI reads with the
   asking employee's own rights.
3. **No personal data in events and notifications** — IDs, numbers, dates and states only.
4. **Conformance stays at 52 / 52** for the examples. A change to Bridge v1 itself (`packages/protocol`) starts with an issue:
   the protocol is versioned and other systems depend on it.

The full list is in the [development guideline](docs/GUIDELINE.en.md).

## Pull requests

- Keep them small and say *why* in the description. Add or update tests; `pnpm test` and `pnpm validate` must pass.
- Documentation is kept in English and Japanese (Chinese where it exists). If you can write only one, that is fine — say so and
  we will add the other.
- Code that an AI coding tool helped write is welcome. Please run it and check it yourself before opening the PR.
- Contributions are accepted under the repository's license, [Apache-2.0](LICENSE).

**How a merge works here:** this public repository receives snapshots from our development repository. We review your PR here,
apply it upstream with you as co-author (`Co-authored-by:`), and it appears in the next sync. The PR is then closed with a link
to that sync commit.

---

## 日本語

質問、バグ報告、ドキュメントの修正、新しい見本システム、どれも歓迎します。

| したいこと | 行き先 |
|---|---|
| 使い方の質問、作ったものの紹介 | [Discussions](https://github.com/ITC-cloud-soft/biz-ai/discussions) |
| バグの報告 | [バグ報告](https://github.com/ITC-cloud-soft/biz-ai/issues/new?template=bug.yml) |
| 自分の業務システムにつなぎたいが、詰まった | [「自分のシステムにつなぎたい」](https://github.com/ITC-cloud-soft/biz-ai/issues/new?template=connect.yml) |
| 小さなところから手伝いたい | [`good first issue`](https://github.com/ITC-cloud-soft/biz-ai/labels/good%20first%20issue) のラベルがついた issue |
| 脆弱性の報告 | **issue には書かないでください。** [SECURITY.md](SECURITY.md) を見てください |

準備と確認のコマンドは上の英語版と同じです（`pnpm install` → `pnpm test` → `pnpm validate` → `pnpm demo`）。
Docker がなければ `FW_TEST_DATABASE_URL` に手元の PostgreSQL を指定します。GitHub Codespaces で開けば、手元の準備は要りません。

**どの変更も守る約束：**
1. AI は確定・承認・支払いをしない。AI の「書き込み」は、人が受け入れる提案だけ。プロンプトではなくコードと設定で守る。
2. 誰が何を見てよいか、誰に知らせるかは業務システムが決める（業務画面と同じチェック）。AI は聞いた本人の権限で読む。
3. イベントと通知に個人情報を入れない（ID・数値・日付・状態だけ）。
4. 見本システムの適合性テストは 52 / 52 のまま。Bridge v1（`packages/protocol`）そのものを変えるときは、先に issue で相談する。

**プルリクエスト：** 小さく、理由を書いてください。テストを足し、`pnpm test` と `pnpm validate` が通ること。
ドキュメントは英語と日本語で持っています。片方だけでもかまいません。AI コーディングツールで書いたコードも歓迎です（自分で動かして確かめてから出してください）。
ライセンスは [Apache-2.0](LICENSE) です。

**マージの流れ：** この公開リポジトリは、開発用リポジトリのスナップショットを受け取っています。PR はここでレビューし、
あなたを共同作者（`Co-authored-by:`）として開発側に取り込み、次の同期で反映します。そのあと同期コミットへのリンクを付けて PR を閉じます。
