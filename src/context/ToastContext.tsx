"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType, ToastContainer } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const updateToast = useCallback((id: string, message: string, type: ToastType, duration: number = 5000) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, message, type, duration } : t))
    );
  }, []);

  const value = React.useMemo(() => ({ 
    showToast, 
    removeToast, 
    updateToast 
  }), [showToast, removeToast, updateToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
