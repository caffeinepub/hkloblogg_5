import { LANGUAGES, type Language } from "../locales/translations";

interface LanguageSelectorProps {
  currentLang: Language;
  onChange: (lang: Language) => void;
}

export default function LanguageSelector({
  currentLang,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div
      className="flex items-center justify-center gap-1 mb-5"
      data-ocid="language.toggle"
    >
      {LANGUAGES.map(({ code, label, flag }) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          data-ocid={`language.${code}.button`}
          className={`
            inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
            transition-all duration-150 border
            ${
              currentLang === code
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
            }
          `}
          aria-label={`Switch to ${label}`}
          aria-pressed={currentLang === code}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
