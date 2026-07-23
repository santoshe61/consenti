import type { LocaleTextContent } from '../types'

export const OPT_IN_DPDPA_JA: LocaleTextContent = {
  mainBanner: {
    heading: 'データ保護に関するお知らせ',
    htmlText:
      '当社はインドのデジタル個人データ保護法（DPDPA）に基づくデータ受託者です。お客様の個人データを処理する前に同意が必要です。',
    buttons: {
      'consent-all': '同意する',
      'deny-all': '同意しない',
      'review-choices': '選択を確認',
    },
  },
  preferenceModal: {
    heading: 'プライバシー設定（DPDPA）',
    subheading: '同意する処理を選択してください。',
    buttons: {
      'consent-all': '同意する',
      'withdraw-all': '同意しない',
      'save-choices': '選択を保存',
    },
    categories: {
      'cat-necessary': {
        heading: '必須',
        htmlText: 'ウェブサイトの動作に不可欠です。同意は不要です。',
      },
      'cat-functional': {
        heading: '機能',
        htmlText: '高度な機能を有効にします。DPDPAに基づき同意が必要です。',
      },
      'cat-preferences': {
        heading: '設定',
        htmlText: '個人設定を保存します。DPDPAに基づき同意が必要です。',
      },
      'cat-analytics': {
        heading: '分析',
        htmlText: 'サイト利用状況の把握に使用します。DPDPAに基づき同意が必要です。',
      },
      'cat-marketing': {
        heading: 'マーケティング',
        htmlText: 'パーソナライズされた広告を可能にします。DPDPAに基づき同意が必要です。',
      },
    },
  },
}
