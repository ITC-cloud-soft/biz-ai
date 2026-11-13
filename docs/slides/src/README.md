# 技術者向けスライドの生成元

`../biz-assistant-framework.pptx` と `../biz-assistant-framework.pdf` はこのフォルダのスクリプトから作ります。
スライドの文言を直すときは pptx を直接編集せず、`build.cjs` を直して作り直してください。

| ファイル | 役割 |
|---|---|
| `build.cjs` | pptxgenjs でデッキを組み立てる（全 42 枚。2026-11-01（RSI の提案書 v0.3）：節「運用 AI」を 11 枚（31〜41）に改訂 — 2 つの AI（本番は読む・提案だけ）・配置（VM-A / VM-B、承認ゲート）・中身（行き先は開発・検証環境と本番の提案）・見える化・**開発環境の RSI**（35、新：見つけて直してそのまま出す、図）・**本番環境の RSI**（36、新：検証環境で再現 → 修正 → 検証環境で確認 → SNS でリリース計画 → 運用担当者が判断、図。検証環境は本番と同じ版・設定・DB 構造・パイプラインでプランだけ違う）・任せる範囲（環境で分け、等級は本番の提案に添えるリスクの目安。「本番も自動」の段階はない）・障害の分離と復旧（本番の再起動・前の版へも 1 タップの承認のあと）・セキュリティの RSI（検知・分析・準備は AI、本番での実施は承認のあと）・運用 AI 自身を守る・ロードマップ（P3 開発環境の RSI、P4 検証環境と本番の提案）。同日の初版は節「運用 AI」の 9 枚（31〜39：2 つの AI・配置（VM-A / VM-B）・中身（Router・Worker・ポリシー）・見える化・変更の等級と自律の段階・障害の分離と復旧・セキュリティの RSI（自動のアップデート・検知・対処）・運用 AI 自身を守る・ロードマップ）・全 40 枚、`docs/RSI_SELF_IMPROVING_SYSTEM.md`。以前は全 31 枚・発表者ノート付き。2026-10-29：長期記憶（plugin-memory）の 1 枚とプラグイン 7 つ、個人ボット・受信者の保証の 3 枚とチェックリストを追加、「課題とゴール」を削除、名前を Biz Assistant Framework に。同日：「SNS で使い方に答える」（@dsh-bridge/help）の 1 枚を追加。2026-10-30：「AI 社員のプロフィール」（plugin-persona）の 1 枚（23）を追加、プラグイン 8 つ（6）、プロトコルに任意の help・ai-profile（4）、層（3）・AI 秘書の署名に呼び名（9）・web-kit の AiProfilePage（18）・つなぎ方（27・28）・事例の数字（29：ツール 29・マニュアル 164 節）・ロードマップ（30：添付ファイル（実装中）・外部連携 P2・P3）・Q&A（31）とノートを更新。同日：ロードマップ（30）を外部連携の続き・OCR のローカルのエンジンに）。最後にテーマの配色・東アジアフォントを書き込み、本文の言語を `ja-JP` にする（日本語の禁則処理を効かせるため） |
| `stats.json` | テスト件数など、スライド 26 に載せる数字（いまは 2026-10-29 の値。全パッケージの合計を数え直したときに更新する）。`pnpm test` / `pnpm run e2e` の結果に合わせて更新する（件数は全パッケージの `tests` の合計。`pnpm -r` の行はパッケージ名が前に付く） |
| `render.ps1` | PowerPoint（COM）で PDF と、確認用の 1 枚ずつの PNG を書き出す（Windows + PowerPoint が必要） |

## 作り直す手順

1. pptxgenjs 4 系を用意する（workspace の依存には入れていない）。どこか一度だけ入れて `NODE_PATH` で指す。

   ```sh
   npm i --prefix "$HOME/.cache/dsh-slides" pptxgenjs@4
   export NODE_PATH="$HOME/.cache/dsh-slides/node_modules"     # PowerShell: $env:NODE_PATH = "..."
   ```

   jszip は pptxgenjs に同梱のものを使うので、別に入れる必要はありません。

2. pptx を生成する（引数を省くと `../biz-assistant-framework.pptx` と `./stats.json`）。

   ```sh
   node docs/slides/src/build.cjs
   ```

3. PDF を書き出す。パスは絶対パスで渡す。

   ```powershell
   $S = (Resolve-Path docs/slides).Path
   pwsh -File "$S/src/render.ps1" -Pptx "$S/biz-assistant-framework.pptx" -Pdf "$S/biz-assistant-framework.pdf"
   ```

4. 文言を変えたら、PNG を書き出して全スライドを目で確かめる（はみ出し・不自然な改行）。

   ```powershell
   pwsh -File "$S/src/render.ps1" -Pptx "$S/biz-assistant-framework.pptx" -PngDir "$env:TEMP/dsh-slides-png"
   ```

`render.ps1` は、起動前から PowerPoint が開いていた場合はそれを閉じません。

## 用語

スライドと docs は日本語の技術者向けです。中国語由来の語は使わず、次のように書きます（コード上の識別子はそのまま）。

| 使わない | 書く |
|---|---|
| 平台 | プラットフォーム／IM／配信先 |
| 免打扰（`quietHours`） | 通知を控える時間帯（おやすみ時間） |
| 即時摘要・固定摘要（digest） | 短時間のまとめ送信・定期のまとめ送信 |
| 插件 | プラグイン |
| 预设 | プリセット |
| 登録簿 | レジストリ |
| 配置（deploy の意味） | デプロイ |
| 一致性テスト | 適合性テスト（conformance suite） |
| 信号管線 | イベントの流れ |
| 記憶（AI の memory） | メモリ |
| 回合 | ターン |
| 企業微信・飛書 | WeCom（企業微信）・Lark（飛書） |
