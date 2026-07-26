import type { Preview } from '@storybook/nextjs-vite';
import { Inter, Space_Grotesk } from 'next/font/google';
import '../src/app/globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased text-foreground bg-background p-4 min-h-[500px]`}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo'
    }
  },
};

export default preview;