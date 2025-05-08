import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { useState, useEffect } from "react";

interface ToastNotificationProps {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function ToastNotification({
  id,
  type,
  title,
  message,
  duration = 4000,
  onClose,
}: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Allow for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIconClass = () => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div
      className={`max-w-xs bg-white border border-gray-200 shadow-lg rounded-lg pointer-events-auto flex items-center p-4 mb-2 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      } animate-fade-in-up`}
    >
      <div className={`flex-shrink-0 ${getIconClass()}`}>{getIcon()}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
      <button
        className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-500 focus:outline-none"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
