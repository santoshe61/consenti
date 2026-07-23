import type { LocaleTextContent } from '../types'

export const OPT_IN_JA: LocaleTextContent = {
  mainBanner: {
    heading: 'プライバシーを大切にしています',
    htmlText:
      'ブラウジング体験の向上、パーソナライズされた広告・コンテンツの表示、トラフィック分析のためにCookieを使用しています。<strong>すべて同意</strong>をクリックすることで、Cookieの使用に同意したことになります。設定はいつでも変更できます。',
    buttons: {
      'accept-all': 'すべて同意',
      'reject-optional': 'すべて拒否',
      'manage-preferences': '設定を管理',
    },
  },
  gpcBanner: {
    heading: 'プライバシー設定が検出されました',
    htmlText:
      'ブラウザからGlobal Privacy Control（GPC）シグナルが送信されました。お客様のプライバシー設定を適用しました。',
    buttons: {
      'accept-all': '設定を確認',
      'confirm-settings': '続行',
    },
  },
  preferenceModal: {
    heading: 'プライバシー設定',
    subheading: '許可するCookieを選択してください。',
    htmlText:
      'さまざまな種類のCookieを使用しています。各カテゴリを有効または無効にすることができます。必須Cookieは無効にできません。',
    buttons: {
      'accept-all': 'すべて同意',
      'reject-optional': 'すべて拒否',
      'save-preferences': '選択を保存',
    },
    categories: {
      'cat-necessary': {
        heading: '必須',
        htmlText: 'これらのCookieはウェブサイトの機能に不可欠であり、無効にすることはできません。',
      },
      'cat-functional': {
        heading: '機能',
        htmlText: '保存された設定やパーソナライゼーションなどの高度な機能を有効にします。',
      },
      'cat-preferences': {
        heading: '設定',
        htmlText: '将来の訪問のために個人設定や好みを保存します。',
      },
      'cat-analytics': {
        heading: '分析',
        htmlText: '訪問者がどのようにウェブサイトを利用しているかを理解するのに役立ちます。',
      },
      'cat-marketing': {
        heading: 'マーケティング',
        htmlText: '関連する広告を表示するために使用されます。',
      },
    },
  },
}
