import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error in Component Tree:', error, errorInfo);
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream text-brand-dark p-6">
          <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-xl border border-red-200 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h2 className="text-2xl font-black text-brand-forest mb-2">
              Daily Drop Kitchen Platform
            </h2>
            <p className="text-brand-muted text-sm mb-4">
              A browser runtime error occurred:
            </p>
            <pre className="bg-red-50 text-red-800 p-4 rounded-xl text-left text-xs font-mono mb-6 overflow-x-auto border border-red-100 max-h-64 whitespace-pre-wrap">
              {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
            </pre>
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleClearCacheAndReload}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
              >
                Clear Storage Cache & Reload
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-brand-forest hover:bg-brand-forest/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
