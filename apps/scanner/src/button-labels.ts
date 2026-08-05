/** Multi-locale substring labels for the two banner actions this scanner needs to trigger on an
 * *arbitrary* site's CMP (not necessarily Consenti's own widget). Deliberately substring-based
 * and case-insensitive rather than exact-match — real-world CMP copy varies ("Accept All
 * Cookies", "Accept all", "I agree", etc.) far more than a fixed string list can enumerate
 * exactly. This is a heuristic, not a guarantee — sites with unusual copy or a non-text
 * (icon-only) control will correctly fall through to `cmpDetected: false` rather than a
 * false-positive click. */
export const ACCEPT_ALL_LABELS: string[] = [
  'accept all', 'accept cookies', 'i agree', 'agree to all', 'allow all', 'allow cookies',
  'aceptar todo', 'aceptar todas', 'tout accepter', 'accepter tout', 'alle akzeptieren',
  'alles akzeptieren', 'accetta tutto', 'aceitar tudo', 'aceitar todos',
  'すべて同意', 'すべてを許可', '全て同意', '全て許可', '全部同意', '全部接受', '接受全部',
  '전체 동의', '모두 동의', 'принять все', 'kabul et', 'tümünü kabul et',
]

export const REJECT_ALL_LABELS: string[] = [
  'reject all', 'decline all', 'deny all', 'refuse all', 'reject cookies', 'necessary only',
  'only necessary', 'essential only',
  'rechazar todo', 'rechazar todas', 'tout refuser', 'refuser tout', 'alle ablehnen',
  'ablehnen', 'rifiuta tutto', 'rejeitar tudo', 'recusar tudo',
  'すべて拒否', '全て拒否', '全部拒绝', '拒绝全部',
  '전체 거부', '모두 거부', 'отклонить все', 'reddet', 'tümünü reddet',
]

/** Labels for the button that opens a CMP's granular preference/customize panel — the third
 * option most real banners have alongside accept-all/reject-all (e.g. OneTrust's "Cookie
 * Settings"). Same substring/case-insensitive heuristic as the two lists above. */
export const MANAGE_PREFERENCES_LABELS: string[] = [
  'cookie settings', 'manage preferences', 'manage cookies', 'cookie preferences',
  'customize', 'customise', 'preferences', 'more options', 'privacy settings',
  'configurar cookies', 'personalizar', 'preferencias',
  'gérer les préférences', 'personnaliser', 'paramètres des cookies',
  'einstellungen', 'cookie-einstellungen', 'anpassen',
  'impostazioni cookie', 'personalizza',
  'configurações de cookies', 'personalizar cookies',
]

/** Labels for the button that submits/confirms whatever was toggled in a preference panel.
 * Deliberately more specific than a bare "save"/"confirm" would be — those alone are too generic
 * for a substring match even scoped to a panel's own container. */
export const SAVE_PREFERENCES_LABELS: string[] = [
  'save preferences', 'save my choices', 'save settings', 'save selection',
  'confirm my choices', 'confirm choices', 'confirm my selection', 'confirm settings',
  'submit preferences', 'apply preferences',
  'guardar preferencias', 'confirmar mis elecciones',
  'enregistrer mes choix', 'confirmer mes choix',
  'einstellungen speichern', 'auswahl speichern',
  'salva le preferenze', 'conferma le scelte',
  'salvar preferências', 'confirmar escolhas',
]

/** Multi-locale substring keywords used by the generic banner fallback (`findGenericBannerFallback`
 * in `banner-detect.ts`) to decide whether a fixed/sticky-positioned element is actually a cookie
 * banner, as opposed to a chat widget, promo bar, or newsletter popup that happens to share the
 * same "fixed overlay" structure but never mentions cookies/consent/privacy at all. This is a
 * *required* gate for that fallback, not a scored bonus — position and structure alone (fixed,
 * touches an edge, has buttons) describe plenty of non-consent UI too. */
export const BANNER_KEYWORDS: string[] = [
  'cookie', 'cookies', 'consent', 'privacy policy', 'privacy notice', 'gdpr', 'ccpa',
  'cookie-richtlinie', 'datenschutz', 'einwilligung',
  'politique de cookies', 'confidentialité', 'consentement',
  'política de cookies', 'privacidad', 'consentimiento',
  'política de privacidade', 'privacidade', 'consentimento',
  'informativa sui cookie', 'privacy', 'consenso',
  'クッキー', 'プライバシー', '同意',
  '쿠키', '개인정보', '동의',
  '隐私', '同意', 'cookie 政策',
]

/** Common banner/modal container selectors this heuristic searches within, before falling back
 * to a whole-page button search. Narrowing to a likely container first avoids accidentally
 * clicking an unrelated same-labeled button elsewhere on the page (e.g. a newsletter form's own
 * "Accept" button). */
export const BANNER_CONTAINER_SELECTORS: string[] = [
  '#consenti-banner', '#consenti-modal', // Consenti itself, when scanning a Consenti-powered site
  '#onetrust-banner-sdk', '#onetrust-pc-sdk', // OneTrust
  '.cookiebot', '#CybotCookiebotDialog', // Cookiebot
  '#klaro', '.klaro', // Klaro
  '#cookie-law-info-bar', '.cli-modal-content', // CookieYes / Cookie Law Info
  '#sp_message_container', '[class*="sp_message_container" i]', // Sourcepoint (main-frame case only — see README's known limitations for the common cross-origin-iframe case)
  '#qc-cmp2-container', // Quantcast Choice
  '#didomi-host', '.didomi-popup-container', // Didomi
  '#truste-consent-track', '#trustarc-banner-container', // TrustArc
  '.osano-cm-window', '.osano-cm-dialog', // Osano
  '[class*="cookie-banner" i]', '[class*="cookie-consent" i]', '[class*="consent-banner" i]',
  '[id*="cookie-banner" i]', '[id*="cookie-consent" i]', '[id*="consent-banner" i]',
  '[role="dialog"]',
]
