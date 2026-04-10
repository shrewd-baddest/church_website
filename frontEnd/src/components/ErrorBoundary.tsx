import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
          return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 space-y-6">
             <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex flex-col items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
             </div>
             <h2 className="text-2xl font-bold text-gray-900">Oops! Something went wrong.</h2>
             <p className="text-gray-500">
               We're having trouble connecting to the server or loading this page. Please check your internet connection and try again.
             </p>
             {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 rounded-md p-4 text-xs font-mono text-left text-red-800 overflow-auto max-h-32">
                    {this.state.error?.message}
                </div>
             )}
             <div className="pt-4">
                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all duration-200"
                >
                  Refresh Page
                </button>
             </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
