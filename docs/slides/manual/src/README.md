# 技術解説（技術担当者向け）の生成元

`../biz-assistant-framework-technical-guide.md`（詳しい本文、公式サイトの技術ページの原稿）と、同じ内容のスライド
`../biz-assistant-framework-technical-guide.pptx` / `.pdf`（50 枚、日本語）。2026-11-13。

- 読み手：経営層への説明のあと、導入・連携の検討を任された技術担当者。構成・Bridge v1 と manifest・主な流れ・安全の約束・つなぎ方と作り方・品質と提供状況。
- 書かないこと：内部の環境名・ホスト名・顧客名（最初の導入例は「介護事業所向けの業務システム」とだけ書く）、AI への指示文や判定の閾値。例は架空（受注管理・設備点検）。
- md とスライドは同じ構成。中身を変えるときは両方を直す（md の方が詳しい）。根拠は `docs/ARCHITECTURE.md`・`docs/GUIDELINE.md`・`packages/protocol`（エンドポイントは `openapi/bridge-v1.yaml` と照合済み）。
- スライドのテーマと部品は maintenance-ai の `docs/slides/ops-ai/src/build-tech.cjs`（運用AI Bot 技術概要）と同じ。

```powershell
$env:NODE_PATH = "$HOME\.cache\dsh-slides\node_modules"   # pptxgenjs 4 + react@18.3.1 react-dom@18.3.1 react-icons@5.3.0 sharp@0.33.5
node build.cjs
$M = (Resolve-Path ..).Path
..\..\marketing\src\render.ps1 -Pptx "$M\biz-assistant-framework-technical-guide.pptx" -Pdf "$M\biz-assistant-framework-technical-guide.pdf" -PngDir "$env:TEMP\fw-tech-png"
```
