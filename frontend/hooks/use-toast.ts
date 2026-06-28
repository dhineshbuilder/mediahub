import { useState, useEffect, useCallback } from 'react';
import { ToastMessage } from '../types/media';

type ToastInput = {
  title: string;
  description: string;
  type?: 'success' | 'error' | 'info';
};

let toastListeners: Array<(toasts: ToastMessage[]) => void> = [];
let memoryToasts: ToastMessage[] = [];

const notify = () => {
  toastListeners.forEach((listener) => listener([...memoryToasts]));
};

export const toast = ({ title, description, type = 'info' }: ToastInput) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { id, title, description, type };
  memoryToasts.push(newToast);
  notify();

  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>(memoryToasts);

  useEffect(() => {
    const listener = (newToasts: ToastMessage[]) => {
      setToasts(newToasts);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    memoryToasts = memoryToasts.filter((t) => t.id !== id);
    notify();
  }, []);

  return { toasts, toast, dismiss };
}
