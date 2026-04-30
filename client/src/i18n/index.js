import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

import enInterview from '../locales/en/interview.json';
import viInterview from '../locales/vi/interview.json';
import devInterview from '../locales/dev/interview.json';

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
			dev: { interview: devInterview },
		},
		lng: 'en',
		defaultNS: 'layout',
		interpolation: {
			excapeValue: false,
		},
		debug: true,
		saveMissing: true,
		missingKeyHandler: function (lng, ns, key) {
			console.warn(`[i18next] Missing key: '${key}' in namespace: '${ns}', language: '${lng}'`);
		},
	});
