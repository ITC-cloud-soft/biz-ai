// The words of bridge-identity in the three languages of the framework (ja / en / zh): the link guide and the replies to
// a link code, the group chat guide, and the replies of the shared bot's application switch (src/app-switch.js).
// The language is the business system's (its manifest's system.locale, @dsh-bridge/dsh-core localeOf(app)); no manifest → ja.
import { frameLocale, messagesOf } from '@dsh-bridge/dsh-core'

const groupChatGuide = (locale) => messagesOf(locale).groupChat

const ja = Object.freeze({
  /** the link keyword shown in the guides when linkKeywords is not configured */
  linkKeyword: '連携',
  linkGuide: (keyword) => `AI 秘書です。お手伝いを始める前に、業務システムとの連携をお願いします。業務Webで連携コードを発行し、『${keyword} 123456』と送信してください（コードの有効期限は 10 分です）。`,
  /** the {displayName} of `linked` ('' without a name) */
  linkedAs: (name) => (name ? `${name} さんとして` : ''),
  replies: Object.freeze({
    unavailable: '申し訳ありません。現在、業務システムに接続できません。しばらくしてから、もう一度お試しください。',
    linked: '連携が完了しました。{displayName}ご利用いただけます。これから、確認やお願いが必要なことをこのチャットでお知らせします。気になることがあれば、いつでも話しかけてください。',
    invalidCode: '連携コードが無効か、有効期限（10分）が切れているようです。お手数ですが、業務Webで新しいコードを発行して、もう一度送ってください。',
    alreadyLinked: 'このアカウントは既に連携済みです。連携先を変更する場合は、管理者にご連絡ください。',
    groupNotAllowed: '連携はボットとの個別チャット（DM）でお願いします。このコードは他の方に見えた可能性があるため、業務Webで新しいコードを発行してください。',
    tooMany: '連携の試行回数が多すぎます。しばらく時間をおいてから、もう一度お試しください。',
    failed: '申し訳ありません。連携に失敗しました。時間をおいて再度お試しいただくか、管理者にご連絡ください。',
    noApplication: '申し訳ありません。このボットはどの業務システムにも割り当てられていません。管理者にご連絡ください。',
    emailNotLinkable: 'メールでは連携できません。業務Webで別の SNS を連携してください。',
    groupChat: groupChatGuide('ja'),
  }),
  switch: Object.freeze({
    listTitle: '【アプリ一覧】このチャットで使える業務アプリ：',
    listFooter: '切り替え：「#アプリ名」　いまのアプリ：「#いま」\nアプリごとに会話・記録は別々です。',
    helpTitle: '【使い方】このチャットでは複数の業務アプリを切り替えて使えます。',
    listItem: (name, label, current) => `・${name}（${label}）${current ? '← いま' : ''}`,
    switched: (name) => `${name}に切り替えました。ここからは${name}の会話です（ほかのアプリの会話とは別です）。`,
    already: (name) => `いまのアプリは${name}です。`,
    current: (name) => `いまのアプリは${name}です。ほかのアプリは「#一覧」で確認できます。`,
    unknown: (query) => `【アプリ一覧】「#${query}」というアプリはこのチャットにありません。「#一覧」で使えるアプリを確認してください。`,
    helpLines: (example) => [
      '・#一覧　使えるアプリの一覧',
      `・#アプリ名${example ? `（例 ${example}）` : ''}　切り替え`,
      '・#いま　いまのアプリ',
      '返信の先頭の【アプリ名】が、そのメッセージのアプリです。通知に返信すると、その通知のアプリの会話になります。',
    ],
    notLinked: (name, keyword) => `${name}とはまだ連携していません。${name}の業務Webで連携コードを発行し、『${keyword} 123456』と送信してください。`,
    switchedByReply: (name, reason) => `（${reason === 'quote' ? '引用された通知' : '通知'}への返信のため、${name}の会話に切り替えました。「#一覧」で切り替えられます）`,
  }),
})

const en = Object.freeze({
  linkKeyword: 'link',
  linkGuide: (keyword) => `I'm the AI assistant. Before I can help, please link your account with the business system: issue a link code in the business web app and send “${keyword} 123456” here (the code is valid for 10 minutes).`,
  linkedAs: (name) => (name ? ` as ${name}` : ''),
  replies: Object.freeze({
    unavailable: 'Sorry, I cannot reach the business system right now. Please try again in a little while.',
    linked: 'Your account is linked{displayName}. From now on I will tell you in this chat when something needs your check or action. Talk to me any time.',
    invalidCode: 'That link code is not valid or has expired (codes are valid for 10 minutes). Please issue a new code in the business web app and send it again.',
    alreadyLinked: 'This account is already linked. To link it to someone else, please contact your administrator.',
    groupNotAllowed: 'Please link your account in a one-to-one chat with the bot. Others may have seen this code, so please issue a new one in the business web app.',
    tooMany: 'Too many link attempts. Please wait a while and try again.',
    failed: 'Sorry, linking failed. Please try again later or contact your administrator.',
    noApplication: 'Sorry, this bot is not assigned to any business system. Please contact your administrator.',
    emailNotLinkable: 'Accounts cannot be linked by email. Please link another chat app in the business web app.',
    groupChat: groupChatGuide('en'),
  }),
  switch: Object.freeze({
    listTitle: '[Apps] The business apps you can use in this chat:',
    listFooter: 'Switch: “#app name”   Current app: “#now”\nEach app has its own conversation and records.',
    helpTitle: '[Help] In this chat you can switch between several business apps.',
    listItem: (name, label, current) => `・${name} (${label})${current ? ' ← now' : ''}`,
    switched: (name) => `Switched to ${name}. From here on this is the ${name} conversation (separate from the other apps).`,
    already: (name) => `The current app is ${name}.`,
    current: (name) => `The current app is ${name}. Send “#list” to see the other apps.`,
    unknown: (query) => `[Apps] There is no app “#${query}” in this chat. Send “#list” to see the apps you can use.`,
    helpLines: (example) => [
      '・#list   the apps you can use',
      `・#app name${example ? ` (e.g. ${example})` : ''}   switch`,
      '・#now   the current app',
      'The [app name] at the start of a reply is the app of that message. Replying to a notification continues in that notification\'s app.',
    ],
    notLinked: (name, keyword) => `You have not linked your account with ${name} yet. Issue a link code in ${name} and send “${keyword} 123456”.`,
    switchedByReply: (name, reason) => `(You replied to ${reason === 'quote' ? 'a quoted notification' : 'a notification'}, so I switched to the ${name} conversation. Send “#list” to switch.)`,
  }),
})

const zh = Object.freeze({
  linkKeyword: '绑定',
  linkGuide: (keyword) => `我是 AI 助理。开始协助您之前，请先绑定业务系统账号：在业务系统网页上生成绑定码，然后在这里发送「${keyword} 123456」（绑定码 10 分钟内有效）。`,
  linkedAs: (name) => (name ? `，身份为 ${name}` : ''),
  replies: Object.freeze({
    unavailable: '抱歉，目前无法连接业务系统。请稍后再试。',
    linked: '绑定完成{displayName}，现在可以使用了。之后需要您确认或处理的事项，我会在这个聊天里通知您。有任何问题，随时找我。',
    invalidCode: '绑定码无效或已过期（有效期 10 分钟）。麻烦您在业务系统网页上重新生成绑定码后再发送。',
    alreadyLinked: '此账号已绑定。如需更改绑定对象，请联系管理员。',
    groupNotAllowed: '请在与机器人的一对一聊天中进行绑定。这个绑定码可能已被他人看到，请在业务系统网页上重新生成。',
    tooMany: '绑定尝试次数过多。请稍后再试。',
    failed: '抱歉，绑定失败。请稍后再试，或联系管理员。',
    noApplication: '抱歉，此机器人未分配给任何业务系统。请联系管理员。',
    emailNotLinkable: '无法通过邮件绑定。请在业务系统网页上绑定其他聊天工具。',
    groupChat: groupChatGuide('zh'),
  }),
  switch: Object.freeze({
    listTitle: '【应用列表】这个聊天中可以使用的业务应用：',
    listFooter: '切换：「#应用名」　当前应用：「#当前」\n每个应用的对话和记录是分开的。',
    helpTitle: '【帮助】在这个聊天中可以切换使用多个业务应用。',
    listItem: (name, label, current) => `・${name}（${label}）${current ? '← 当前' : ''}`,
    switched: (name) => `已切换到${name}。之后是${name}的对话（与其他应用的对话分开）。`,
    already: (name) => `当前应用是${name}。`,
    current: (name) => `当前应用是${name}。发送「#列表」可以查看其他应用。`,
    unknown: (query) => `【应用列表】这个聊天中没有名为「#${query}」的应用。发送「#列表」查看可用的应用。`,
    helpLines: (example) => [
      '・#列表　可用应用的列表',
      `・#应用名${example ? `（例 ${example}）` : ''}　切换`,
      '・#当前　当前应用',
      '回复开头的【应用名】就是该消息所属的应用。回复通知后，会进入该通知所属应用的对话。',
    ],
    notLinked: (name, keyword) => `您还没有绑定${name}。请在${name}的业务系统网页上生成绑定码，然后发送「${keyword} 123456」。`,
    switchedByReply: (name, reason) => `（因为您回复了${reason === 'quote' ? '引用的通知' : '通知'}，已切换到${name}的对话。发送「#列表」可以切换）`,
  }),
})

export const MESSAGES = Object.freeze({ ja, en, zh })
export const messagesFor = (locale) => MESSAGES[frameLocale(locale)]
/** The link keywords accepted when linkKeywords is not configured (every language's). */
export const ALL_LINK_KEYWORDS = Object.freeze([ja.linkKeyword, en.linkKeyword, zh.linkKeyword])
