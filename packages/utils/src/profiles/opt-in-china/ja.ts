import type { LocaleTextContent } from '../types'

export const OPT_IN_CHINA_JA: LocaleTextContent = {
  mainBanner: {
    heading: '個人情報処理に関するお知らせ',
    htmlText:
      '個人情報保護法（PIPL）に基づき、データ処理の前にお知らせする義務があります。お客様の同意を得た特定の目的にのみデータを使用します。',
    buttons: {
      'agree-all': '同意する',
      'reject-non-necessary': '拒否する',
      'manage-preferences': '設定',
    },
  },
  preferenceModal: {
    heading: 'プライバシー設定（PIPL）',
    subheading: '同意するデータ処理を選択してください。',
    buttons: {
      'agree-all': '同意する',
      'disagree-all': '拒否する',
      'confirm-settings': '選択を保存',
    },
    categories: {
      'cat-necessary': {
        heading: '必須',
        htmlText: 'ウェブサイトに不可欠です。目的：セキュリティと基本機能。',
      },
      'cat-functional': {
        heading: '機能',
        htmlText: '目的：ユーザー体験の向上。PIPLに基づき同意が必要です。',
      },
      'cat-preferences': {
        heading: '設定',
        htmlText: '目的：個人設定の保存。PIPLに基づき同意が必要です。',
      },
      'cat-analytics': {
        heading: '分析',
        htmlText: '目的：サイト利用統計。PIPLに基づき同意が必要です。',
      },
      'cat-marketing': {
        heading: 'マーケティング',
        htmlText: '目的：パーソナライズされた広告。PIPLに基づき同意が必要です。',
      },
    },
  },
}
