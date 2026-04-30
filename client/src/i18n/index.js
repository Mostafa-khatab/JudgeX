import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

import enInterview from '../locales/en/interview.json';
import viInterview from '../locales/vi/interview.json';

export const locales = {
	en: 'English',
	vi: 'Tiếng Việt',
};

i18next
	.use(initReactI18next)
	.use(HttpApi)
	.init({
		resources: {
			en: { interview: enInterview },
			vi: { interview: viInterview },
		},
		lng: 'en',
		fallbackLng: 'en',
		defaultNS: 'layout',
		interpolation: {
			escapeValue: false,
		},
		debug: false,
	});
