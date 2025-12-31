/**
 * Comprehensive theme configuration for DocSpice
 * Ensures consistent visual theming across all components
 */

export const theme = {
  // Color palette
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Sky blue
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      serif: ['PT Serif', 'Georgia', 'Times New Roman', 'serif'],
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },

  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
    '5xl': '8rem',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Transitions
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
    bounce: '200ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },

  // Component-specific styles
  components: {
    button: {
      base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      sizes: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl',
      },
      variants: {
        primary: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-600 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:scale-105',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 border border-gray-200',
        outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      },
    },
    input: {
      base: 'block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors',
      sizes: {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2 text-base',
        lg: 'px-4 py-3 text-lg',
      },
      states: {
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
      },
    },
    card: {
      base: 'bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden',
      hover: 'hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1',
      padding: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    badge: {
      base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants: {
        primary: 'bg-blue-100 text-blue-800',
        secondary: 'bg-gray-100 text-gray-800',
        success: 'bg-green-100 text-green-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800',
      },
    },
  },

  // Layout
  layout: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '7xl': '1600px',
    },
    container: 'max-w-7xl mx-auto px-6',
    section: 'py-12 lg:py-16',
  },

  // Animations
  animations: {
    fadeIn: 'animate-fade-in',
    fadeInUp: 'animate-fade-in-up',
    fadeInDelay: 'animate-fade-in-delay',
    pulse: 'animate-gentle-pulse',
    shimmer: 'shimmer',
    bounce: 'animate-bounce',
    spin: 'animate-spin',
  },

  // Breakpoints (for reference)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

// Utility functions for theme usage
export const getButtonClasses = (
  variant: keyof typeof theme.components.button.variants = 'primary',
  size: keyof typeof theme.components.button.sizes = 'md'
): string => {
  return `${theme.components.button.base} ${theme.components.button.sizes[size]} ${theme.components.button.variants[variant]}`
}

export const getInputClasses = (
  size: keyof typeof theme.components.input.sizes = 'md',
  state?: keyof typeof theme.components.input.states
): string => {
  const baseClasses = `${theme.components.input.base} ${theme.components.input.sizes[size]}`
  const stateClasses = state ? theme.components.input.states[state] : ''
  return `${baseClasses} ${stateClasses}`.trim()
}

export const getCardClasses = (
  padding: keyof typeof theme.components.card.padding = 'md',
  hover: boolean = false
): string => {
  const baseClasses = `${theme.components.card.base} ${theme.components.card.padding[padding]}`
  const hoverClasses = hover ? theme.components.card.hover : ''
  return `${baseClasses} ${hoverClasses}`.trim()
}

export const getBadgeClasses = (
  variant: keyof typeof theme.components.badge.variants = 'primary'
): string => {
  return `${theme.components.badge.base} ${theme.components.badge.variants[variant]}`
}

// CSS custom properties generator for runtime theme switching
export const generateCSSCustomProperties = (themeColors = theme.colors): string => {
  const properties: string[] = []
  
  Object.entries(themeColors).forEach(([colorName, colorValues]) => {
    if (typeof colorValues === 'object') {
      Object.entries(colorValues).forEach(([shade, value]) => {
        properties.push(`--color-${colorName}-${shade}: ${value};`)
      })
    }
  })
  
  return `:root { ${properties.join(' ')} }`
}

export type Theme = typeof theme
export type ThemeColors = typeof theme.colors
export type ButtonVariant = keyof typeof theme.components.button.variants
export type ButtonSize = keyof typeof theme.components.button.sizes
export type InputSize = keyof typeof theme.components.input.sizes
export type InputState = keyof typeof theme.components.input.states
export type CardPadding = keyof typeof theme.components.card.padding
export type BadgeVariant = keyof typeof theme.components.badge.variants