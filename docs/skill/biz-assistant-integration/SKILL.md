---
name: biz-assistant-integration
description: >-
  Biz Assistant Framework（Bizアシスタント、パッケージ @dsh-bridge/*、リポジトリ https://github.com/ITC-cloud-soft/biz-ai）を
  業務システムに導入する手順書。新しく開発する業務システムを framework の上で作る場合と、既存の業務システムに「ブリッジ」
  （Bridge v1 の窓口・manifest・本人の SNS 連携・受信者の規則・transactional outbox・承認・報告）を足して AI 社員とつなぐ場合の
  両方を、診断 → 計画 → 実装 → 検証（manifest の strict 検証・conformance 52 / 52・profile の検査）まで導く。
  次のような依頼で使う：「Bizアシスタントを導入したい」「biz assistant framework を既存システムにつなぐ」「業務システムを AI 社員と
  働く形にしたい」「Bridge v1 を実装」「manifest を書く」「server-kit の hooks」「conformance を通す」「DSH の profile に登録」
  「把 biz assistant framework 导入新系统/既有系统」「给业务系统加 AI 社员」「integrate Biz Assistant Framework into an app」。
---

# Biz Assistant Framework を業務システムに導入する

このスキルは、業務システム（職員・役割・ログインを持つ IT システム）に Biz Assistant Framework を入れ、
**AI 社員**（職員一人ひとりの AI アシスタント。チャットで知らせ・頼み・下書きし、人が決める）と働く形にするための手順です。

- **正本は framework のリポジトリの文書**です。このスキルは道順と判断の要点をまとめたもので、細部・最新の値は必ずリポジトリで確かめます。
  - `docs/GUIDELINE.md`（開発ガイドライン。手順 b、拡張点 c、規則 d、テスト e、版 f、FAQ g）
  - `docs/ARCHITECTURE.md`（構成・流れ・受信者の保証・安全の約束）
  - `packages/protocol/README.md`（Bridge v1・manifest・conformance 52 項目）、`packages/server-kit/README.md`、`packages/web-kit/README.md`、`plugins/*/README.md`
  - 見本：`examples/equipment-inspection`（server-kit の上に新しく作った業務システム。conformance 52 / 52）
- 細かい手順はこのフォルダの `references/` に分けてあります。いま必要なものだけ読みます（下の「参照の使い分け」）。

## 0. 最初にすること

1. **framework を手元に用意する**（読めない場合はユーザーに権限を確認する）：

   ```sh
   git clone https://github.com/ITC-cloud-soft/biz-ai.git framework
   cd framework && git log -1 --format='%h %cs'     # どの版に基づいて作業したかを記録する
   pnpm install && pnpm test && pnpm validate      # Node 22.19 以上・pnpm 10。framework 自身が通ることを先に確かめる
   ```

   以降、framework の checkout を `<framework>` と書きます。`@dsh-bridge/*` は npm に公開されていない（private 0.1.0）ので、
   依存は checkout からつなぎます（`references/02-new-system.md` の「置き場所と依存」）。
2. **`docs/GUIDELINE.md` の冒頭「既存の業務システムをつなぐ：チェックリスト」と b 節の図を読む**。このスキルの手順はそれに対応しています。
3. **対象の業務システムを読む**：言語・フレームワーク、ログインとセッション、職員と役割の表、業務 API（読取・書込み）、承認の規則、
   状態を変える処理（どこでトランザクションを張っているか）、定期処理、業務 Web とそのサーバ側（BFF）の有無。

## 1. 道を選ぶ

| 状況 | 道 | 主な参照 |
|---|---|---|
| これから作る業務システム | **新規**：server-kit の上で作る（Bridge の部分は kit が持つ。書くのは業務・hooks・manifest・画面） | `references/02-new-system.md`（GUIDELINE b.0） |
| 既存・Node.js で、自分のコードを変えてよい | **既存＋server-kit**：既存のサーバに `createBridgeApp` を載せ、hooks を既存の表・関数につなぐ | `references/03-existing-system.md` |
| 既存・同じ働きの API をすでに持つ | **既存＋別名**：`/bridge/v1` を既存のルートに別名で載せる（無い項目は足す） | `references/03-existing-system.md`（GUIDELINE b.2'） |
| 既存・Node.js 以外 | **既存＋自前実装**：`packages/protocol/openapi/bridge-v1.yaml` をその言語で実装し、conformance で検証する | `references/03-existing-system.md` |
| 既存・コードを一切変えたくない | **外付けモード（試行）**：外にブリッジ専用サービスを置く。既存システムに IdP・本人として呼べる API・commit 後の変化の知らせ・承認と書込みの API があることが条件 | `references/03-existing-system.md`（GUIDELINE b.10、EXTERNAL_LAYER_FEASIBILITY.md） |
| 足す量が大きすぎる（画面しか無い・API が無い） | 新規として作り直す、または業務を 1 つずつ新しいシステムへ移す | `references/01-assessment.md` |

判断に迷うときは、先に `references/01-assessment.md` の診断を行い、結果をユーザーに見せて決めてもらいます。

## 2. 進め方（どの道でも同じ順序）

作業の初めに `templates/integration-plan.md` を写して計画書を作り、項目ごとに状態を更新します。

1. **診断と計画**（`references/01-assessment.md`）：チェックリスト 13 項目について「ある／足す／別名」を表にし、足す量を見積もる。
   最初に扱う**業務を 1 つ**決める（例：請求の承認、点検の期限）。ユーザーの決定が要る点（下の「人に決めてもらうこと」）を洗い出す。
2. **manifest を書いて検証**（`references/04-manifest.md`）：役割と委託の上限・event と payload の許可リスト・文面・ツール・playbook・報告。
   承認と連携解除の 3 つの event は必須。`bridge-validate manifest --strict` が exit 0。
3. **業務側を実装**（`references/05-business-side.md`）：hooks（`employees`・`authenticate`・`isSessionLive`・`recipientsFor`・`approvals`・
   `proposalKinds`・`reports`・`piiScan`）、AI の読取 GET に `readToolPolicy`、書込みは人のセッションだけ。
4. **event をトランザクションで書く**（同上）：業務の行と `kit.emitEvent` を同じ `kit.tx` で。
5. **conformance 52 項目**（`references/10-verification.md`）：TEST 環境に対して。fixtures は役割の写しと hook をそろえる。
6. **DSH の製品 profile に登録**（`references/06-dsh-profile.md`）：`profile/template` を写す、レジストリ、ボット、送信の設定は閉じた値のまま、
   すべてのアプリに `linkGuard` の URL、AI 社員のプリセット。
7. **業務 Web と BFF**（`references/07-web-and-bff.md`）：SNS 連携・通知設定・承認・AI 提案・AI 社員の設定の画面、gateway、BFF の秘密の規則。
8. **自動タスク**（`references/06-dsh-profile.md` の後半）：委託の分類と職員を決めて playbook を有効化。
9. **任意の機能**（`references/08-optional-features.md`）：マニュアルで使い方に答える・長期記憶の名簿検査・AI 社員のプロフィール・添付・外部連携・スキャン文書。
10. **完了の条件をコマンドで確かめる**（`references/10-verification.md`）：manifest・conformance・業務のテスト・マニュアル・profile・送信の設定・型検査。

各ステップの前後で `references/09-rules.md`（MUST / SHOULD の要約）に反していないかを見直します。

## 3. 守ること（要点。全文は GUIDELINE d 節）

- **framework の中を書き換えない**（`packages/*`・`plugins/*`・`vendor/*`・`profile/template`・`profile/scripts`）。足りないところは hooks・
  ツール／文面のモジュール・プラグインと profile の設定・製品の profile の写しで補う。どうしても足りなければ framework への issue にする。
- **AI は読む・提案するだけ**：AI のツールは GET と `POST /bridge/v1/proposals` だけ。業務の書込み API は委託を 403 にする。金額を AI に決めさせない。
- **受信者は業務システムが決める**：`recipientsFor` で範囲を決め、1 人ずつ「その人が業務 Web で同じ対象を見られるか」を Web の認可と同じ関数で確かめる。
  範囲が決まらなければ送らない。
- **event と文面に個人情報を載せない**：payload は ID・日付・件数・状態だけ、文面の引数は数値・日付だけ、リンクは ID だけのパス。
- **SNS の連携は本人だけ・システム自身のログインで**：別の本人確認を作らない。管理者でも他人の連携を作れない。
- **秘密はリポジトリ・yml・ログ・チャットに書かない**：環境変数の名前だけを設定に書く。秘密の値はユーザーに入れてもらう。
- **送信の設定は雛形の閉じた値のまま**：開けるのは明示の opt-in（その行を変え、理由をコメントに残す）だけ。
- **テストは架空のデータ・ループバック・TEST 環境だけ**。本番・デモ環境のポート・DB に向けない。DSH は隔離した home で動かす（個人の `~/.dsh` は使わない）。
- **「何も変えずにつながる」とは言わない**：既存システムに足すものを計画書に明記する。

## 4. 人に決めてもらうこと

次は推測で決めず、計画書に選択肢と推奨を書いてユーザーの決定を待ちます。

- 最初に扱う業務と、AI に読ませる範囲（manifest の `tools` と各ツールの `roles`、役割ごとの `delegation: none | read | propose`）
- 通知する event と、その受信者の規則（誰に・どの範囲で）、夜間も届ける種別（`notify.quiet: exempt`）
- AI に出させる提案の種類と、採択できる役割
- 自動タスクの委託の分類と、委託する職員（広い役割を選ばない）、または `<class>=each`
- 開ける送信の設定（opt-in）があるか、その理由
- 使うチャット（組織のボット・個人ボット）、使う AI モデル
- 任意の機能（マニュアル・プロフィール・添付・外部連携）の採否、スキャン PDF の扱い（OCR エンジン／モデル／読まない）

## 5. 参照の使い分け

| いま知りたいこと | 読むもの |
|---|---|
| 既存システムで何を足すか・どの道か | `references/01-assessment.md` |
| 新しく作るときのリポジトリ構成と依存 | `references/02-new-system.md` |
| 既存への載せ方（server-kit・別名・他言語・外付け） | `references/03-existing-system.md` |
| manifest の書き方と検証 | `references/04-manifest.md` |
| hooks・event・受信者・承認・提案・報告の実装 | `references/05-business-side.md` |
| DSH の profile・レジストリ・送信の設定・自動タスク | `references/06-dsh-profile.md` |
| 業務 Web の画面と BFF の規則 | `references/07-web-and-bff.md` |
| マニュアル・記憶・プロフィール・添付・外部連携・文書 | `references/08-optional-features.md` |
| MUST / SHOULD の要約 | `references/09-rules.md` |
| conformance・完了の条件・最終チェックリスト | `references/10-verification.md` |
| 計画書のひな形 | `templates/integration-plan.md` |

## 6. 終わり方

- 完了の条件（`references/10-verification.md`）の結果を、コマンドと出力の要約つきで報告する。確かめていないもの（実際のチャット・モデルでの確認など）は「未確認」と書く。
- 計画書に、足したもの・決めたこと・開けた設定（opt-in）とその理由・残っている作業を残す。
- 基にした framework の版（コミット）を書く。framework の版が上がったら GUIDELINE の f 節（版の管理）と変更点を確かめる。
