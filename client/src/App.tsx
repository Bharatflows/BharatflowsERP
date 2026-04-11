// Main App Component with React Router
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NetworkStatusProvider } from './contexts/NetworkStatusContext';
import { LocaleProvider } from './contexts/LocaleContext';
import { AppRoutes } from './routes/index';
import { Toaster } from './components/ui/sonner';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ErrorLogProvider } from './contexts/ErrorLogContext';
import { NetworkStatusIndicator } from './components/ui/NetworkStatusIndicator';
import { DesignSystemProvider } from './components/system/DesignSystemProvider';
import './styles/globals.css';

import { GoogleOAuthProvider } from '@react-oauth/google';


const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const innerContent = (
    <AuthProvider>
      <NetworkStatusProvider>
        <AppRoutes />
        <Toaster position="top-right" />
        <NetworkStatusIndicator />
      </NetworkStatusProvider>
    </AuthProvider>
  );

  return (
    <ErrorBoundary>
      <ErrorLogProvider>
        <ThemeProvider>
          <LocaleProvider>
            <DesignSystemProvider>
              <QueryProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  {googleClientId ? (
                    <GoogleOAuthProvider clientId={googleClientId}>
                      {innerContent}
                    </GoogleOAuthProvider>
                  ) : (
                    innerContent
                  )}
                </BrowserRouter>
              </QueryProvider>
            </DesignSystemProvider>
          </LocaleProvider>
        </ThemeProvider>
      </ErrorLogProvider>
    </ErrorBoundary>
  );
}

export default App;
