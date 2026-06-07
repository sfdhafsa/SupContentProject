import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "../i18n/translations";
import { useI18n } from "../i18n/I18nContext";

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800 ${
        compact ? "w-fit" : ""
      }`}
      title={t("language.switch")}
    >
      {SUPPORTED_LANGUAGES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLanguage(option)}
          className={`min-w-9 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase transition-colors ${
            language === option
              ? "bg-[#D0021B] text-white shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
          aria-label={LANGUAGE_LABELS[option]}
          aria-pressed={language === option}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
