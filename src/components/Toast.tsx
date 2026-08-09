import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastContextType {
  showToast: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((title: string, description?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
                toast.type === 'success'
                  ? 'bg-zinc-900/90 dark:bg-zinc-900/95 text-white border-blue-500/30 shadow-blue-500/10'
                  : toast.type === 'error'
                  ? 'bg-rose-950/90 text-rose-100 border-rose-500/30 shadow-rose-500/10'
                  : 'bg-zinc-900/90 text-zinc-100 border-zinc-700/40'
              }`}
            >
              <div className="flex-shrink-0">
                {toast.type === 'success' && (
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  </div>
                )}
                {toast.type === 'error' && (
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                  </div>
                )}
                {toast.type === 'info' && (
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm tracking-tight">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{toast.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
