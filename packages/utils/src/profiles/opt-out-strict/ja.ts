import type { LocaleTextContent } from '../types'

export const OPT_OUT_STRICT_JA: LocaleTextContent = {
  mainBanner: {
    heading: 'カリフォルニア州のプライバシー権',
    htmlText:
      'カリフォルニア・プライバシー権法（CPRA）に基づき、お客様には個人データの販売・共有・利用に異議を申し立てる権利があります。',
    buttons: {
      'accept-all': 'すべて同意',
      'opt-out-sale-sharing-sensitive': '販売・共有しない',
      manage: '設定を管理',
    },
  },
  gpcBanner: {
    heading: 'GPC検出 – CPRAオプトアウト適用済み',
    htmlText:
      'ブラウザからGlobal Privacy Controlシグナルが検出されました。CPRAに基づくオプトアウト権が自動的に適用されました。',
    buttons: {
      'accept-all': '設定を確認',
      'confirm-opt-out': '続行',
    },
  },
  preferenceModal: {
    heading: 'プライバシー設定（CPRA）',
    subheading: 'プライバシー権を管理してください。',
    buttons: {
      'accept-all': 'すべて同意',
      'opt-out-sale-sharing-sensitive': '販売・共有しない',
      'save-choices': '選択を保存',
    },
    categories: {
      'cat-necessary': { heading: '必須', htmlText: 'ウェブサイトの動作に不可欠です。' },
      'cat-functional': { heading: '機能', htmlText: '高度な機能を有効にします。' },
      'cat-preferences': { heading: '設定', htmlText: '個人設定を保存します。' },
      'cat-analytics': { heading: '分析', htmlText: 'サイト利用状況の把握に役立てます。' },
      'cat-marketing': {
        heading: '販売・共有（CPRA）',
        htmlText: 'CPRAに基づく個人データの販売および共有。異議を申し立てることができます。',
      },
    },
  },
}
