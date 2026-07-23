import type { LocaleTextContent } from '../types'

export const NOTICE_ONLY_JA: LocaleTextContent = {
  mainBanner: {
    heading: '当サイトは必須Cookieのみを使用しています',
    htmlText:
      'サイトの正常な動作に必要な技術的Cookieのみを使用しています。マーケティングや分析のCookieは使用していません。',
    buttons: {
      ok: 'OK',
    },
  },
  preferenceModal: {
    heading: 'Cookieに関する情報',
    buttons: {
      close: '閉じる',
    },
    categories: {
      'cat-necessary': {
        heading: '必須Cookie',
        htmlText: 'サイトの正常な動作に必要な技術的Cookieです。無効にすることはできません。',
      },
    },
  },
}
