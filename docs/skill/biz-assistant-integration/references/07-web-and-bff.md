# 07 業務 Web の画面（web-kit）と BFF

正本：`docs/GUIDELINE.md` b.6・d.9、`packages/web-kit/README.md`、`packages/gateway`（README）、`docs/ARCHITECTURE.md` §9。

## 1. 画面

| 画面 | 部品 | 誰が |
|---|---|---|
| IM ボット接続（組織のボット） | `ImBotsShell mode="admin"`（`channels` は必須：`channelDefs(DEFAULT_CHANNELS, loaders)`。`excludeBotIds` で職員の個人ボットを外す） | 管理者 |
| SNS 連携 | `SnsLinkPage`：① 自分のボット（`personalChannels` + `personalRpc`）② 組織のボットへの連携コード ③ 自分の連携と解除 ④ 通知設定 | すべての職員（本人のものだけ） |
| 通知設定 | `NotifyPrefsCard`（`labels` は manifest の `events.<type>.label` から**ビルド時に**作る。manifest はサービストークンでしか取れない） | すべての職員 |
| AI 社員の設定 | `AiProfilePage`（既定は `agents` を渡さず呼び名 1 つ） | 管理者 |
| 添付の設定 | `AttachmentSettingsCard` | 管理者 |
| 外部連携 | `ExternalConnectorsPage` | 管理者 |
| ヘルプ（マニュアル） | web-kit core の `manualChapters` / `parseMarkdown` | すべての職員 |
| 承認・AI 提案・AI アシスタントのパネル | framework には無い。業務ごとに作る。提案は `GET /bridge/v1/proposals`・`POST …/{proposalId}/accept`・`POST …/{proposalId}/reject`。承認は業務システム自身の `/api/*`（`mayDecide`・`decide`・`t.revokeApprovalDeliveries`） | — |

```tsx
<WebKitProvider runtime={runtime}
  meIm={createMeImClient({ base: '/bridge/v1', weixinBase: '/api/me/im/weixin' })}   // 同じオリジン・本人のセッション（使わなければ weixinBase: null）
  adminRpc={createAdminRpc('/dsh/api/dsh-im')}                                         // BFF の DSH ゲートウェイ
  strings={{ 'sns.title': '外部アカウント連携' }}>
  <SnsLinkPage isAdmin={user.role === 'admin'} notify={{ role: user.role, labels: manifestEventLabels }} />
</WebKitProvider>
```

web-kit は `.ts` のまま配られる：業務 Web のバンドラで読み、`tsc --noEmit` を完了の条件に入れる。

## 2. BFF の規則（守るのは BFF と業務システム。web-kit は表示を整えるだけ）

- `@dsh-bridge/gateway` を `/api/*` の転送より**前**に置く（`gateway.handleRequest(req, res)`、WebSocket は `handleUpgrade`）。
  `getSessionUser` は業務 API のログインの確認を req の cookie で呼ぶ。`isAllowed` は通常 admin だけ（DSH の設定画面 `/dsh/*`）。
- ブラウザの要求を業務システムへ転送するのは、web-kit が同じオリジンで呼ぶ経路と業務の `/api/*` だけ：`/bridge/v1/me/*`、`/bridge/v1/admin/ai-profile*`、
  添付の設定、`/bridge/v1/admin/connector*`、`/bridge/v1/proposals`（と accept / reject）。**本人の cookie のまま、`x-bff-secret` を付けない**。
- **MUST** `x-bff-secret` を付けるのは BFF 自身がサーバ側で組み立てる呼び出しだけ：
  - Web アシスタントのチケット `POST /bridge/v1/assistant/tickets`
  - 添付の変換 `POST /bridge/v1/assistant/attachments/prepare`（`prepareAssistantAttachments`）
  - 本人用 RPC で `createOnly` の作成に成功した直後の個人ボットの登録 `POST /bridge/v1/me/personal-bots`
  ブラウザから来たこれらの要求は転送しない（秘密付きで中継すると、組織のボットを自分の個人ボットとして登録でき、他の職員が全員「未連携」になる）。
- サーバ側の RPC は `rpcAllowlist` に書いたものだけが通る（空なら全部拒否）。AI アシスタントは
  `gateway.rpc('/assistant', 'message.send', { ticket, agent, text, attachments }, { plugin: 'bridge-assistant' })`。チケット・DSH の cookie・launch token はブラウザに出さない。

## 3. 個人ボット（使うなら、d.9）

- BFF に本人用 RPC（`POST /api/me/im/rpc/<channel>`）を作る。framework の部品にも見本にも無いので、次の MUST をすべて満たす：
  - チャネルごとの許可リスト（作業フォルダ・モデル・プリセット・文脈強化・アクセス方針を変える方法は許さない）
  - `botId` は本人のものだけ（`GET /bridge/v1/me/personal-bots` で毎回確かめる）、応答の `bots[]` を本人の分に絞る
  - 作成は `createOnly: true`（既存のボットに当たれば `bot-exists`）、直列化し、増えた botId を本人に登録、失敗したらボットを削除して戻す
- 各職員は自分の接続だけを設定する。他人の接続を見る・作る・解除する画面や API を作らない（管理者を含む）。
- 照会の持ち主の規則（個人ボットなら連携先が持ち主のときだけ連携済み）は server-kit が持つ。自前の実装なら必須。
