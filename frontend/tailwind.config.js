/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                heading: ['Manrope', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
                xl: '1rem',
                '2xl': '1.5rem',
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                status: {
                    approved: {
                        bg: 'hsl(var(--status-approved-bg))',
                        text: 'hsl(var(--status-approved-text))',
                        border: 'hsl(var(--status-approved-border))',
                    },
                    pending: {
                        bg: 'hsl(var(--status-pending-bg))',
                        text: 'hsl(var(--status-pending-text))',
                        border: 'hsl(var(--status-pending-border))',
                    },
                    rejected: {
                        bg: 'hsl(var(--status-rejected-bg))',
                        text: 'hsl(var(--status-rejected-text))',
                        border: 'hsl(var(--status-rejected-border))',
                    },
                },
                absence: {
                    ferie: {
                        DEFAULT: 'hsl(var(--absence-ferie))',
                        text: 'hsl(var(--absence-ferie-text))',
                    },
                    permesso: {
                        DEFAULT: 'hsl(var(--absence-permesso))',
                        text: 'hsl(var(--absence-permesso-text))',
                    },
                    malattia: {
                        DEFAULT: 'hsl(var(--absence-malattia))',
                        text: 'hsl(var(--absence-malattia-text))',
                    },
                },
            },
            boxShadow: {
                'card': '0 2px 8px rgba(0,0,0,0.04)',
                'card-hover': '0 8px 24px rgba(0,0,0,0.08)',
                'dropdown': '0 10px 40px rgba(0,0,0,0.12)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
