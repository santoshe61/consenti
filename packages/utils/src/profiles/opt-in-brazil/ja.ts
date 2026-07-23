import type { LocaleTextContent } from '../types'

export const OPT_IN_BRAZIL_JA: LocaleTextContent = {
  mainBanner: {
    heading: 'プライバシーを大切にしています',
    htmlText:
      'ブラジルの一般データ保護法（LGPD）に基づき、お客様の同意または正当な利益を根拠として個人データを処理します。設定はいつでも変更できます。',
    buttons: {
      'accept-all': 'すべて同意',
      'reject-optional': 'すべて拒否',
      manage: '管理する',
    },
  },
  preferenceModal: {
    heading: 'プライバシー設定（LGPD）',
    subheading: 'プライバシーオプションを選択してください。',
    buttons: {
      'accept-all': 'すべて同意',
      'reject-optional': 'すべて拒否',
      'save-preferences': '選択を保存',
    },
    categories: {
      'cat-necessary': { heading: '必須', htmlText: 'ウェブサイトの動作に不可欠です。' },
      'cat-functional': {
        heading: '機能',
        htmlText: '高度な機能を有効にします。法的根拠：正当な利益（LGPD第10条）。',
      },
      'cat-preferences': {
        heading: '設定',
        htmlText: '設定を保存します。法的根拠：正当な利益（LGPD第10条）。',
      },
      'cat-analytics': {
        heading: '分析',
        htmlText: 'サイト利用状況の把握に役立てます。LGPDに基づき同意が必要です。',
      },
      'cat-marketing': {
        heading: 'マーケティング',
        htmlText: 'パーソナライズされた広告を可能にします。LGPDに基づき同意が必要です。',
      },
    },
  },
}
