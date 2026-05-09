/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		extend: {
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			colors: {
				primary: '#0ea5e9',
				secondary: '#ffaf16',
			},
			keyframes: {
				shimmer: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(100%)' },
				},
			},
			animation: {
				shimmer: 'shimmer 2s infinite',
			},
		},
		fontFamily: {
			poppins: ['Poppins', 'sans-serif'],
		},
	},
	darkMode: ['class'],
	plugins: [
        require('tailwindcss-animate'),
        require('@tailwindcss/typography')
    ],
};
