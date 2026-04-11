import { useEffect } from 'react';
import { useParams, Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, type SupportedLanguage } from '../i18n';

export function LanguageRouter() {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  const isValid = lang && supportedLanguages.includes(lang as SupportedLanguage);

  useEffect(() => {
    if (isValid && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, isValid, i18n]);

  if (!isValid) {
    return <Navigate to="/fr/" replace />;
  }

  return <Outlet />;
}
