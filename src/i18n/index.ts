import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './en.json';
import tr from './tr.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
};

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const supportedLocale = deviceLocale === 'tr' ? 'tr' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: supportedLocale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

export default i18n;
