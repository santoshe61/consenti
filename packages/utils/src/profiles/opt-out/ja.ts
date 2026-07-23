import type { LocaleTextContent } from '../types'

export const OPT_OUT_JA: LocaleTextContent = {
  mainBanner: {
    heading: 'Cookieを使用しています',
    htmlText:
      'サービス向上のためにCookieを使用しています。個人データの販売や共有にはいつでも異議を申し立てることができます。',
    buttons: {
      'accept-all': 'すべて同意',
      'do-not-sell-share': '販売・共有しない',
      'manage-preferences': '設定を管理',
    },
  },
  gpcBanner: {
    heading: 'GPC検出 – オプトアウト適用済み',
    htmlText:
      'ブラウザからGlobal Privacy Controlシグナルが送信されました。データの販売および共有からオプトアウトしました。',
    buttons: {
      'accept-all': '設定を確認',
      'confirm-opt-out': '続行',
    },
  },
  preferenceModal: {
    heading: 'プライバシー設定',
    subheading: 'プライバシーオプションを選択してください。',
    buttons: {
      'accept-all': 'すべて同意',
      'opt-out-all': '販売・共有しない',
      'save-choices': '選択を保存',
    },
    categories: {
      'cat-necessary': { heading: '必須', htmlText: 'ウェブサイトの機能に不可欠です。' },
      'cat-functional': {
        heading: '機能',
        htmlText: '高度な機能とパーソナライゼーションを有効にします。',
      },
      'cat-preferences': { heading: '設定', htmlText: '将来の訪問のために設定を保存します。' },
      'cat-analytics': {
        heading: '分析',
        htmlText: '訪問者のサイト利用状況を把握するのに役立ちます。',
      },
      'cat-marketing': {
        heading: '広告・販売',
        htmlText: 'ターゲット広告を可能にします。データの販売に異議を申し立てることができます。',
      },
    },
  },
}
