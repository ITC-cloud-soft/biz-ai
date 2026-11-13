# セキュリティ監視 AI の経営者向け（営業）デッキの生成元

`../biz-assistant-security-for-executives.pptx` と `../biz-assistant-security-for-executives.pdf` は `build.cjs` から作ります。pptx を直接編集せず、`build.cjs` を直して作り直してください。

- 位置づけ：技術資料 `docs/slides/security/biz-assistant-security-rsi.pptx` の、経営者・事業責任者向けの平易版（全 15 枚・各ページに発表者ノート）。ブランドは Bizアシスタント、見た目は `../../biz-assistant-for-executives.pptx` と同じ（汉字の丸・チャットの電話）。
- **売り：RSI（自己進化）を前面に**。守るだけなら他社と同じ——ちがいは、**自分で安全に仮攻撃（模擬攻撃）して守れているかを確かめ、穴をふさぎ、くり返して毎週強くなる**こと。検知カバレッジという数字で効果を示す。「攻撃する」ではなく必ず「仮攻撃／模擬攻撃」と書く（自社資産のみ・確認環境が既定・承認・キルスイッチ・非破壊）。「攻撃される」は他者からの攻撃を指す場合のみ。
- 流れ：RSI の宣言（自分で攻めて強くなる）→ どの製品も「守ります」だが効いているか不明 → 固定から育てるへ → 自己進化ループ（仮攻撃→気づけたか→ふさぐ→対処→強くなる）→ 仮攻撃＝エンジン → 効果が数字で（カバレッジ）→ 土台（外から監視・チャット承認・毎晩更新）→ 安心（人が決める）→ 他社比較 → 効果・導入・CTA（仮攻撃デモ）・IT 付録。数字・社名・文面はすべて架空の例。
- 設計：`docs/RSI_SELF_IMPROVING_SYSTEM.md` §10〜§12。連絡先は `src/contact.local.json`（`{ "contact": "…" }`、git 管理外）で差し替え可。

## 作り直す手順

pptxgenjs の用意は `../../src/README.md` と同じ（`NODE_PATH` で指す）。

```sh
node docs/slides/marketing/security/src/build.cjs
```

```powershell
$S = (Resolve-Path docs/slides/marketing/security).Path
pwsh -File docs/slides/src/render.ps1 -Pptx "$S/biz-assistant-security-for-executives.pptx" -Pdf "$S/biz-assistant-security-for-executives.pdf"
pwsh -File docs/slides/src/render.ps1 -Pptx "$S/biz-assistant-security-for-executives.pptx" -PngDir "$env:TEMP/sec-mkt-png"   # 目で確かめる
```
