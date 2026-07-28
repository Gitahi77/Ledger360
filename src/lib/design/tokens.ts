/**
 * Ledger360 Design Tokens
 * 
 * This file provides JavaScript-accessible design tokens for use in non-CSS contexts,
 * primarily data visualization (Recharts) and dynamic inline styles when necessary.
 */

export const ChartStandards = {
  // Chart Colors (Semantic mappings)
  colors: {
    primary: 'hsl(161, 69%, 37%)', // Brand Green
    positive: 'hsl(161, 69%, 37%)',
    negative: 'hsl(348, 83%, 47%)',
    neutral: 'hsl(215, 16%, 47%)',
    grid: 'rgba(0, 0, 0, 0.05)',
    tooltipBackground: 'hsl(0, 0%, 100%)',
    tooltipBorder: 'hsl(214, 32%, 91%)',
  },
  
  // Radii for bar charts / pie charts
  radii: {
    bar: [4, 4, 0, 0] as [number, number, number, number],
  },
  
  // Common geometry
  strokeWidth: 2,
  
  // Typography for SVG charts
  typography: {
    fontFamily: 'Inter, sans-serif',
    fontSize: 12,
    textColor: 'hsl(215, 16%, 47%)',
  },
  
  // Animation
  animation: {
    duration: 300,
    easing: 'ease-out',
  }
};

export const LayoutTokens = {
  touchTargetMin: 44, // Minimum height/width for interactive elements on mobile
  headerHeight: 64,
  sidebarWidth: 280,
  bottomNavHeight: 64,
};

export const IconSizes = {
  button: 16,
  card: 18,
  primary: 20,
  nav: 24,
  hero: 28,
};
