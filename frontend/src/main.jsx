import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppUserProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { clerkAppearanceDark, clerkAppearanceLight } from './lib/clerkAppearance';
import AppRouter from './router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const ClerkWithTheme = ({ children }) => {
  const { theme } = useTheme();
  return (
    <ClerkProvider
      publishableKey={CLERK_KEY}
      appearance={theme === 'light' ? clerkAppearanceLight : clerkAppearanceDark}
    >
      {children}
    </ClerkProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ClerkWithTheme>
        <QueryClientProvider client={queryClient}>
          <AppUserProvider>
            <SettingsProvider>
              <AppRouter />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-1)',
                    border: '0.5px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '13px',
                  },
                }}
              />
            </SettingsProvider>
          </AppUserProvider>
        </QueryClientProvider>
      </ClerkWithTheme>
    </ThemeProvider>
  </StrictMode>,
);
