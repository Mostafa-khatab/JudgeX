import React from 'react';

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
        <div style={{
          minHeight: '100-vh',
          backgroundColor: '#050505',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            backgroundColor: '#171717',
            border: '1px solid #333',
            borderRadius: '24px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              height: '80px',
              width: '80px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
            </div>
            
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>Something went wrong</h1>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '32px', lineHeight: '1.6' }}>
              An unexpected error occurred. Don't worry, your data is safe. 
              Try refreshing the page or going back home.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                Refresh Page
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: 'transparent',
                  border: '1px solid #333',
                  color: '#aaa',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}
              >
                Go to Homepage
              </button>
            </div>

            {import.meta.env.DEV && (
              <div style={{ marginTop: '32px', textAlign: 'left', padding: '16px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#555', marginBottom: '8px' }}>Error Details</p>
                <p style={{ fontSize: '12px', fontFamily: 'monospace', color: 'rgba(248, 113, 113, 0.8)', wordBreak: 'break-all' }}>{this.state.error?.message}</p>
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
