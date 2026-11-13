# 公式サイト（Bizアシスタント）の設計とモック

- [`site-design.md`](site-design.md)：設計書（コンセプト・サイト構成・トップページの文案・色と文字・動き・レスポンシブ・実装方針・SEO・レビューの論点）
- [`mock/`](mock/index.html)：全 11 ページの HTML モック（トップ・仕組み・機能・安全・つなぎ方・開発者・ドキュメント・コミュニティ・運用AI Bot・FAQ・お問い合わせ）。
  日本語・English・中文の切替つき（`assets/i18n-*.js`）。共通の見た目と動きは `assets/site.css`・`assets/site.js`
- `mock/technical-guide.html`・`mock/guideline.html`：技術解説と開発ガイドラインを Web ページにしたもの（3 言語。**生成物・手で直さない**）

公開先（予定）：https://assistanted-it.myaiportal.net 。参考：https://metacoder.myaiportal.net/ （同じファミリーの製品サイト）。

ローカルで見る（ファイルを直接開くか、簡易サーバで）：

```sh
python -m http.server 18765 --bind 127.0.0.1 --directory docs/website/mock   # → http://127.0.0.1:18765/
```

## ドキュメントのページを作り直す

原稿は Markdown：日本語が正本（`docs/GUIDELINE.md`・`docs/slides/manual/biz-assistant-framework-technical-guide.md`）、
訳は同じフォルダの `.en.md`・`.zh-CN.md`。日本語を直したら訳も直し、生成し直す。

```sh
# markdown-it 14 を一度だけ用意（リポジトリの外。例：~/.cache/biz-site）
npm install --prefix ~/.cache/biz-site markdown-it@14.1.0
NODE_PATH=~/.cache/biz-site/node_modules node docs/website/tools/build-docs.cjs
```

- 訳の見出しは日本語と**同じ数・同じ順**にする（ページ内リンクは見出しの順番で日本語のアンカーから訳のアンカーへ読み替える）。
  数が合わない・解決できないリンクがあると警告を出し、終了コード 2。
- 訳の `.md` のリンク（ページ内・もう一方の文書）は生成のときにその言語のものへ書き換える（GitHub でもそのまま読める）。
- リポジトリ内のほかのファイルへのリンクは GitHub（biz-ai）の URL に、mermaid の図はブラウザで描く（`assets/docs.js`）。

画面・数値の例はすべて架空。誇張表現・価格・競合名・実在の顧客名・内部の環境名を載せない（site-design.md 1.4・6 節）。
