import type { LocaleTextContent } from '../types'

export const GENERAL_PRIVACY_CONSENT_JA: LocaleTextContent = {
  mainBanner: {
    heading: 'Cookieを使用しています',
    htmlText:
      'サービスの提供・改善のためにCookieおよび類似技術を使用しています。マーケティングCookieにはお客様の同意が必要です。その他は正当な利益を根拠としています。',
    buttons: {
      'accept-all': 'すべて同意',
      'reject-marketing': 'マーケティングを拒否',
      'manage-preferences': '設定を管理',
    },
  },
  preferenceModal: {
    heading: 'プライバシー設定',
    subheading: 'Cookieの設定を選択してください。',
    buttons: {
      'accept-all': 'すべて同意',
      'necessary-only': 'マーケティングを拒否',
      'save-preferences': '選択を保存',
    },
    categories: {
      'cat-necessary': { heading: '必須', htmlText: 'ウェブサイトの動作に不可欠です。' },
      'cat-functional': {
        heading: '機能',
        htmlText: '高度な機能を有効にします。法的根拠：正当な利益。',
      },
      'cat-preferences': {
        heading: '設定',
        htmlText: '個人設定を保存します。法的根拠：正当な利益。',
      },
      'cat-analytics': {
        heading: '分析',
        htmlText: 'サイト利用状況の把握に役立てます。法的根拠：正当な利益。',
      },
      'cat-marketing': {
        heading: 'マーケティング',
        htmlText: 'パーソナライズされた広告を可能にします。お客様の同意が必要です。',
      },
    },
  },
}
