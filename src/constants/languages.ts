export interface Language {
  code: string;       // internal code used in DB (fi, en, sv…)
  deeplCode: string;  // DeepL target_lang code
  label: string;      // display name
  flag: string;       // emoji flag
  nativeName: string; // name in its own language
}

// FI and EN are always enabled — they use the existing DB columns
// All others are stored in the `translations` JSONB column
export const CORE_LANGUAGES: Language[] = [
  { code: "fi", deeplCode: "FI",    label: "Finnish",  flag: "🇫🇮", nativeName: "Suomi" },
  { code: "en", deeplCode: "EN-GB", label: "English",  flag: "🇬🇧", nativeName: "English" },
];

export const EXTRA_LANGUAGES: Language[] = [
  { code: "sv", deeplCode: "SV",    label: "Swedish",            flag: "🇸🇪", nativeName: "Svenska" },
  { code: "et", deeplCode: "ET",    label: "Estonian",           flag: "🇪🇪", nativeName: "Eesti" },
  { code: "de", deeplCode: "DE",    label: "German",             flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "fr", deeplCode: "FR",    label: "French",             flag: "🇫🇷", nativeName: "Français" },
  { code: "es", deeplCode: "ES",    label: "Spanish",            flag: "🇪🇸", nativeName: "Español" },
  { code: "it", deeplCode: "IT",    label: "Italian",            flag: "🇮🇹", nativeName: "Italiano" },
  { code: "nl", deeplCode: "NL",    label: "Dutch",              flag: "🇳🇱", nativeName: "Nederlands" },
  { code: "nb", deeplCode: "NB",    label: "Norwegian",          flag: "🇳🇴", nativeName: "Norsk" },
  { code: "da", deeplCode: "DA",    label: "Danish",             flag: "🇩🇰", nativeName: "Dansk" },
  { code: "pl", deeplCode: "PL",    label: "Polish",             flag: "🇵🇱", nativeName: "Polski" },
  { code: "ru", deeplCode: "RU",    label: "Russian",            flag: "🇷🇺", nativeName: "Русский" },
  { code: "ja", deeplCode: "JA",    label: "Japanese",           flag: "🇯🇵", nativeName: "日本語" },
  { code: "zh", deeplCode: "ZH",    label: "Chinese (Simplified)", flag: "🇨🇳", nativeName: "中文" },
  { code: "ar", deeplCode: "AR",    label: "Arabic",             flag: "🇸🇦", nativeName: "العربية" },
  { code: "ko", deeplCode: "KO",    label: "Korean",             flag: "🇰🇷", nativeName: "한국어" },
  { code: "pt", deeplCode: "PT-PT", label: "Portuguese",         flag: "🇵🇹", nativeName: "Português" },
];

export const ALL_LANGUAGES = [...CORE_LANGUAGES, ...EXTRA_LANGUAGES];

export function getLang(code: string): Language | undefined {
  return ALL_LANGUAGES.find((l) => l.code === code);
}
