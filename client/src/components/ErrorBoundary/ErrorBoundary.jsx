import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '~/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-10 text-center shadow-2xl ring-1 ring-white/5">
            <div className="h-20 w-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/20">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Something went wrong</h1>
            <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
              An unexpected error occurred. Don't worry, your data is safe. 
              Try refreshing the page or going back home.
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh Page
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="w-full h-12 text-neutral-400 hover:text-white hover:bg-white/5 font-bold rounded-xl gap-2"
              >
                <Home className="h-4 w-4" />
                Go to Homepage
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 text-left p-4 bg-black/50 rounded-xl border border-white/5 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-2">Error Details</p>
                <p className="text-xs font-mono text-red-400/80 break-all">{this.state.error?.message}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
