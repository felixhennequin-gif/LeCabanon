import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonFr from './locales/fr/common.json';
import landingFr from './locales/fr/landing.json';
import appFr from './locales/fr/app.json';
import authFr from './locales/fr/auth.json';

const resources = {
  fr: {
    common: commonFr,
    landing: landingFr,
    app: appFr,
    auth: authFr,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  defaultNS: 'common',
  ns: ['common', 'landing', 'app', 'auth'],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
export const supportedLanguages = ['fr'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
