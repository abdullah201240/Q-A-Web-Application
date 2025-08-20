import React from "react";

export type ToastVariant = "default" | "success" | "destructive" | "warning" | "info";
export type ToastPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left";

export type ActionElement = React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  position?: ToastPosition;
  duration?: number;
  action?: ActionElement;
}

export interface ToastInternal extends ToastOptions {
  id: string;
  onClose?: () => void;
}

export interface ToastContextType {
  toast: (props: ToastOptions) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};


