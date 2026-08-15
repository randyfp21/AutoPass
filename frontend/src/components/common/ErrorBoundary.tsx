import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error captured by ErrorBoundary:', error, errorInfo);
  }

  private handleGoToLogin = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle size={28} />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-slate-900">
                Terjadi Kesalahan Aplikasi
              </h2>
              <p className="text-xs text-slate-500">
                Aplikasi mengalami kendala teknis atau status sesi telah berakhir. Silakan masuk kembali ke akun Anda.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-100 text-slate-700 text-[11px] font-mono rounded-xl text-left overflow-x-auto max-h-24 border border-slate-200">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleGoToLogin}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <LogIn size={15} /> Ke Halaman Login
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200 transition-all"
              >
                <RefreshCw size={14} /> Refresh Halaman
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
