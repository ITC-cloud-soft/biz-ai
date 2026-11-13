# Skills

AI コーディングエージェント（Claude Code など）に読ませる手順書（skill）。

| skill | 何をする |
|---|---|
| [`biz-assistant-integration`](biz-assistant-integration/SKILL.md) | Biz Assistant Framework を、新しく開発する業務システム、または既存の業務システムに導入する（診断 → 計画 → manifest・hooks・event → conformance 52 / 52 → DSH の profile → 業務 Web と BFF → 自動タスク → 完了の条件） |

## 使い方

前提：このリポジトリ（https://github.com/ITC-cloud-soft/biz-ai）を読めること。skill はリポジトリの文書（`docs/GUIDELINE.md` ほか）を正本として参照する。

Claude Code で使う場合は、フォルダごと skill の置き場所に写す：

```sh
# 個人で使う（すべてのプロジェクト）
cp -r docs/skill/biz-assistant-integration ~/.claude/skills/
# 導入先の業務システムのリポジトリで使う（チームで共有）
cp -r <framework>/docs/skill/biz-assistant-integration <業務システム>/.claude/skills/
```

そのあと「この業務システムに Bizアシスタントを導入して」「biz assistant framework を既存システムにつなぎたい」などと頼むと、skill が読み込まれる。
ほかのエージェントでは `SKILL.md` を最初に読ませ、`references/` を必要に応じて読ませる。

## 構成

```
biz-assistant-integration/
  SKILL.md                     入口：道の選び方・進め方・守ること・人に決めてもらうこと
  references/
    01-assessment.md           既存システムの診断（13 項目・外付けモードの 4 能力）
    02-new-system.md           新しく作る（置き場所と依存・ファイルの形）
    03-existing-system.md      既存につなぐ（server-kit・別名・他言語・外付けモード）
    04-manifest.md             manifest の書き方と検証
    05-business-side.md        hooks・event・受信者・承認・提案・報告
    06-dsh-profile.md          DSH の profile・送信の設定・自動タスク
    07-web-and-bff.md          業務 Web の画面と BFF の規則
    08-optional-features.md    マニュアル・記憶・プロフィール・添付・外部連携・文書
    09-rules.md                MUST / SHOULD の要約
    10-verification.md         conformance・完了の条件・最終チェックリスト
  templates/
    integration-plan.md        導入計画書のひな形
```

## 保守

- skill は `docs/GUIDELINE.md` の要約と道順。GUIDELINE・プロトコル・profile の雛形を変えたら、対応する `references/` も直す（コマンド・フラグ・ファイルのパスは実物と照合する）。
- 例は架空（受注管理など）。内部の環境名・ホスト名・顧客名・秘密の値を書かない。
