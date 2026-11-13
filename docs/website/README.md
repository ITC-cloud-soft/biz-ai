# 公式サイト（Bizアシスタント）の設計とモック

- [`site-design.md`](site-design.md)：設計書（コンセプト・サイト構成・トップページの文案・色と文字・動き・レスポンシブ・実装方針・SEO・レビューの論点）
- [`mock/`](mock/index.html)：全 11 ページの HTML モック（トップ・仕組み・機能・安全・つなぎ方・開発者・ドキュメント・コミュニティ・運用AI Bot・FAQ・お問い合わせ）。
  日本語・English・中文の切替つき（`assets/i18n-*.js`）。共通の見た目と動きは `assets/site.css`・`assets/site.js`

公開先（予定）：https://assistanted-it.myaiportal.net 。参考：https://metacoder.myaiportal.net/ （同じファミリーの製品サイト）。

ローカルで見る（ファイルを直接開くか、簡易サーバで）：

```sh
python -m http.server 18765 --bind 127.0.0.1 --directory docs/website/mock   # → http://127.0.0.1:18765/
```

画面・数値の例はすべて架空。誇張表現・価格・競合名・実在の顧客名・内部の環境名を載せない（site-design.md 1.4・6 節）。
