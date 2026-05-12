import i18n from 'i18next';
import detector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// the translations
const resources = {
    kh: {
        translation: {
            Dashboard: 'Dashboard',
            Products: 'Products',
        },
    },

    en: {
        translation: {
            Dashboard: 'Dashboard',
            Products: 'Products',
        },
    },
    cn: {
        translation: {
            Dashboard: 'Dashboard',
            Products: 'Products',
        },
    },
};

const language = localStorage.getItem('I18N_LANGUAGE');
if (!language) {
    localStorage.setItem('I18N_LANGUAGE', 'kh');
}

i18n.use(detector)
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
        lng: localStorage.getItem('I18N_LANGUAGE') || 'kh',
        fallbackLng: 'en', // use en if detected lng is not available

        keySeparator: false, // we do not use keys in form messages.welcome

        interpolation: {
            escapeValue: false, // react already safes from xss
        },
    });

export default i18n;
