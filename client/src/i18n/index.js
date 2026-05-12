import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const modules = import.meta.glob('../locales/**/*.json', { eager: true });
const resources = {};

for (const path in modules) {
	const parts = path.split('/');
	const lng = parts[parts.length - 2];
	const ns = parts[parts.length - 1].replace('.json', '');
	
	if (!resources[lng]) {
		resources[lng] = {};
	}
	resources[lng][ns] = modules[path].default || modules[path];
}

export const locales = {
	en: 'English',
	vi: 'Tiếng Việt',
	dev: 'Dev'
};

i18next
	.use(initReactI18next)
	.init({
		resources,
		lng: 'en',
		fallbackLng: 'en',
		defaultNS: 'layout',
		interpolation: {
			escapeValue: false,
		},
		debug: false,
	});

export default i18next;
