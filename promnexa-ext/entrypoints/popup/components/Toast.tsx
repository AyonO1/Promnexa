import React from "react";
import type { ToastMessage } from "../../../lib/types";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 2500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const iconMap: Record<ToastMessage["type"], React.ReactNode> = {
    success: <CheckCircle style={{ color: "var(--success)" }} />,
    error: <AlertCircle style={{ color: "var(--error)" }} />,
    info: <Info style={{ color: "var(--info)" }} />,
  };

  return (
    <div className={`toast toast--${toast.type}`}>
      {iconMap[toast.type]}
      <span>{toast.message}</span>
    </div>
  );
};

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback(
    (message: string, type: ToastMessage["type"] = "success") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
    },
    [],
  );

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = React.useMemo(() => {
    const Container: React.FC = () => (
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    );
    return Container;
  }, [toasts, dismissToast]);

  return { addToast, ToastContainer };
}
