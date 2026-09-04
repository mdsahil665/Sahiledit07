import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  onBack?: () => void;
  onGoDashboard?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AdminErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/95 border border-rose-500/30 text-white space-y-6 max-w-4xl mx-auto animate-fade-in shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">
                {this.props.fallbackTitle || 'Unable to Load This Section'}
              </h3>
              <p className="text-xs text-zinc-400">
                An unexpected runtime error occurred while rendering this admin section. Your data is safe in Firestore.
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-rose-300 overflow-x-auto">
              <p className="font-bold text-rose-400 mb-1">{this.state.error.name}: {this.state.error.message}</p>
              {this.state.error.stack && (
                <pre className="text-[10px] text-zinc-500 max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {this.props.onBack && (
              <button
                type="button"
                onClick={this.props.onBack}
                className="px-5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer min-h-[44px] min-w-[44px]"
                title="Go back to previous admin page"
              >
                <ArrowLeft className="w-4 h-4 text-blue-400" />
                <span>← Back</span>
              </button>
            )}
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            {this.props.onGoDashboard && (
              <button
                type="button"
                onClick={this.props.onGoDashboard}
                className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 min-h-[44px]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

