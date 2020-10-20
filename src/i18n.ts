import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-xhr-backend";
import Cache from 'i18next-localstorage-backend'
import { initReactI18next } from 'react-i18next'
import translationEn from "./locales/en.json";
import translationRu from "./locales/ru.json";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(Cache)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: true,
    interpolation: {
      escapeValue: false, 
    },
    react: {
      useSuspense: false
    },
    resources: {
      en: { translation: translationEn },
      ru: { translation: translationRu },
    },
});

export default i18n;
