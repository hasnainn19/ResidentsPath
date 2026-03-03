import type { Theme } from '@aws-amplify/ui-react';

export const amplifyComponentsTheme: Theme = {
	name: 'hounslow-theme',
	tokens: {
		colors: {
			brand: {
				primary: {
					10: { value: '#f3e5f7' },
					20: { value: '#e0d4fd' },
					40: { value: '#b39ddb' },
					60: { value: '#9575cd' },
					80: { value: '#6d3874' },
					90: { value: '#652f6c' },
					100: { value: '#5a2a60' },
				},
			},
			background: {
				primary: { value: '#ffffff' },
				secondary: { value: '#f7f7f7' },
			},
			font: {
				primary: { value: '#000000' },
			},
		},
		fonts: {
			default: {
				variable: { value: 'Roboto, Arial, sans-serif' },
				static: { value: 'Roboto, Arial, sans-serif' },
			},
		},
		components: {
			button: {
				primary: {
					backgroundColor: { value: '{colors.brand.primary.80}' },
					_hover: {
						backgroundColor: { value: '{colors.brand.primary.90}' },
					},
					_focus: {
						backgroundColor: { value: '{colors.brand.primary.90}' },
					},
					_active: {
						backgroundColor: { value: '{colors.brand.primary.100}' },
					},
				},
			},
			tabs: {
				item: {
					_active: {
						borderColor: { value: '{colors.brand.primary.80}' },
						color: { value: '{colors.brand.primary.80}' },
					},
					_hover: {
						color: { value: '{colors.brand.primary.90}' },
					},
				},
			},
		},
	},
};
