import './bootstrap';
import './i18n';
import './scss/themes.scss';
import 'simplebar-react/dist/simplebar.min.css';

import { createInertiaApp } from '@inertiajs/react';
import { initializeTheme } from '@/hooks/use-appearance';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pages = import.meta.glob('./pages/**/*.tsx');

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const page = pages[`./pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Unknown Inertia page: ${name}`);
        }

        return page() as never;
    },
    setup({ el, App, props }) {
        createRoot(el as HTMLElement).render(<App {...props} />);
    },
    strictMode: true,
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
