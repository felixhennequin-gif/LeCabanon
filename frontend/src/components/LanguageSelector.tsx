import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supportedLanguages } from "../i18n";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

const languageLabels: Record<string, string> = {
  fr: "FR",
};

export function LanguageSelector() {
  const { lang = "fr" } = useParams<{ lang: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  function handleChange(newLang: string) {
    if (newLang === lang) return;
    const newPath = location.pathname.replace(`/${lang}`, `/${newLang}`);
    i18n.changeLanguage(newLang);
    navigate(newPath + location.search, { replace: true });
  }

  if (supportedLanguages.length <= 1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] px-2 py-1 bg-[var(--color-input)] rounded-[var(--radius-input)]">
        <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
        {languageLabels[lang] ?? lang.toUpperCase()}
      </span>
    );
  }

  return (
    <select
      value={lang}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xs px-2 py-1 bg-[var(--color-input)] border border-[var(--color-border)] rounded-[var(--radius-input)] text-[var(--color-text-secondary)] cursor-pointer"
    >
      {supportedLanguages.map((l) => (
        <option key={l} value={l}>
          {languageLabels[l] ?? l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
