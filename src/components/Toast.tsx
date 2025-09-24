

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const icons = {
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-red-500" />,
  info: <Info className="text-blue-500" />,
};

const Toast: React.FC = () => {
  const { toast, hideToast } = useToast();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] animate-fade-in">
      <div className="flex items-center gap-4 bg-base shadow-2xl rounded-lg p-4 border-l-4 border-primary">
        <div>{icons[toast.type]}</div>
        <div className="text-sm font-medium text-text-primary">{toast.message}</div>
        <button onClick={hideToast} className="ml-4 p-1 text-text-secondary hover:text-text-primary">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toast;