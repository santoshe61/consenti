import { Select } from './Select'
import type { SelectOption } from './Select'

// Common BCP 47 locale codes with display names
const LOCALE_OPTIONS: SelectOption[] = [
  { value: 'en', label: 'en — English' },
  { value: 'en-US', label: 'en-US — English (United States)' },
  { value: 'en-GB', label: 'en-GB — English (United Kingdom)' },
  { value: 'en-AU', label: 'en-AU — English (Australia)' },
  { value: 'en-CA', label: 'en-CA — English (Canada)' },
  { value: 'en-IN', label: 'en-IN — English (India)' },
  { value: 'ar', label: 'ar — Arabic' },
  { value: 'ar-SA', label: 'ar-SA — Arabic (Saudi Arabia)' },
  { value: 'bg-BG', label: 'bg-BG — Bulgarian (Bulgaria)' },
  { value: 'bs-BA', label: 'bs-BA — Bosnian (Bosnia)' },
  { value: 'ca-AD', label: 'ca-AD — Catalan (Andorra)' },
  { value: 'cs-CZ', label: 'cs-CZ — Czech (Czech Republic)' },
  { value: 'da-DK', label: 'da-DK — Danish (Denmark)' },
  { value: 'de', label: 'de — German' },
  { value: 'de-AT', label: 'de-AT — German (Austria)' },
  { value: 'de-CH', label: 'de-CH — German (Switzerland)' },
  { value: 'de-DE', label: 'de-DE — German (Germany)' },
  { value: 'de-LI', label: 'de-LI — German (Liechtenstein)' },
  { value: 'de-LU', label: 'de-LU — German (Luxembourg)' },
  { value: 'el-CY', label: 'el-CY — Greek (Cyprus)' },
  { value: 'el-GR', label: 'el-GR — Greek (Greece)' },
  { value: 'es', label: 'es — Spanish' },
  { value: 'es-ES', label: 'es-ES — Spanish (Spain)' },
  { value: 'es-MX', label: 'es-MX — Spanish (Mexico)' },
  { value: 'es-AR', label: 'es-AR — Spanish (Argentina)' },
  { value: 'et-EE', label: 'et-EE — Estonian (Estonia)' },
  { value: 'fi-FI', label: 'fi-FI — Finnish (Finland)' },
  { value: 'fr', label: 'fr — French' },
  { value: 'fr-BE', label: 'fr-BE — French (Belgium)' },
  { value: 'fr-CH', label: 'fr-CH — French (Switzerland)' },
  { value: 'fr-FR', label: 'fr-FR — French (France)' },
  { value: 'fr-LU', label: 'fr-LU — French (Luxembourg)' },
  { value: 'fr-MC', label: 'fr-MC — French (Monaco)' },
  { value: 'he', label: 'he — Hebrew' },
  { value: 'hi', label: 'hi — Hindi' },
  { value: 'hi-IN', label: 'hi-IN — Hindi (India)' },
  { value: 'hr-HR', label: 'hr-HR — Croatian (Croatia)' },
  { value: 'hu-HU', label: 'hu-HU — Hungarian (Hungary)' },
  { value: 'id', label: 'id — Indonesian' },
  { value: 'is-IS', label: 'is-IS — Icelandic (Iceland)' },
  { value: 'it', label: 'it — Italian' },
  { value: 'it-IT', label: 'it-IT — Italian (Italy)' },
  { value: 'ja', label: 'ja — Japanese' },
  { value: 'ko', label: 'ko — Korean' },
  { value: 'lt-LT', label: 'lt-LT — Lithuanian (Lithuania)' },
  { value: 'lv-LV', label: 'lv-LV — Latvian (Latvia)' },
  { value: 'mk-MK', label: 'mk-MK — Macedonian (North Macedonia)' },
  { value: 'mt-MT', label: 'mt-MT — Maltese (Malta)' },
  { value: 'nb-NO', label: 'nb-NO — Norwegian Bokmål (Norway)' },
  { value: 'nl', label: 'nl — Dutch' },
  { value: 'nl-BE', label: 'nl-BE — Dutch (Belgium)' },
  { value: 'nl-NL', label: 'nl-NL — Dutch (Netherlands)' },
  { value: 'pl-PL', label: 'pl-PL — Polish (Poland)' },
  { value: 'pt', label: 'pt — Portuguese' },
  { value: 'pt-BR', label: 'pt-BR — Portuguese (Brazil)' },
  { value: 'pt-PT', label: 'pt-PT — Portuguese (Portugal)' },
  { value: 'ro-RO', label: 'ro-RO — Romanian (Romania)' },
  { value: 'ru', label: 'ru — Russian' },
  { value: 'sk-SK', label: 'sk-SK — Slovak (Slovakia)' },
  { value: 'sl-SI', label: 'sl-SI — Slovenian (Slovenia)' },
  { value: 'sq-AL', label: 'sq-AL — Albanian (Albania)' },
  { value: 'sr-Latn-BA', label: 'sr-Latn-BA — Serbian Latin (Bosnia)' },
  { value: 'sr-Latn-ME', label: 'sr-Latn-ME — Serbian Latin (Montenegro)' },
  { value: 'sv-SE', label: 'sv-SE — Swedish (Sweden)' },
  { value: 'th', label: 'th — Thai' },
  { value: 'tr', label: 'tr — Turkish' },
  { value: 'uk', label: 'uk — Ukrainian' },
  { value: 'vi', label: 'vi — Vietnamese' },
  { value: 'zh', label: 'zh — Chinese (Simplified)' },
  { value: 'zh-TW', label: 'zh-TW — Chinese (Traditional)' },
  { value: 'zh-HK', label: 'zh-HK — Chinese (Hong Kong)' },
]

interface CountrySelecterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  class?: string
}

export { LOCALE_OPTIONS }

export function CountrySelecter({ value, onChange, placeholder = 'Select locale…', disabled, id, class: extraClass }: CountrySelecterProps) {
  return (
    <Select
      options={LOCALE_OPTIONS}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      searchable
      {...(disabled !== undefined ? { disabled } : {})}
      {...(id !== undefined ? { id } : {})}
      {...(extraClass !== undefined ? { class: extraClass } : {})}
    />
  )
}
