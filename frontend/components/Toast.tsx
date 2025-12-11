'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-50 border-green-300 text-green-800',
    error: 'bg-red-50 border-red-300 text-red-800',
    info: 'bg-blue-50 border-blue-300 text-blue-800',
  }[type];

  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${bgColor} animate-in slide-in-from-top-5`}
    >
      <span className="text-lg">{icon}</span>
      <p className="font-medium">{message}</p>
      <button
        onClick={onClose}
        className="ml-2 text-lg opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

