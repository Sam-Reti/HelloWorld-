import { Injectable, signal } from '@angular/core';
import { Toast, ToastType, ToastOptions } from './toast.models';

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

const MAX_VISIBLE = 5;

let nextId = 0;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string, options?: ToastOptions): void {
    this.show('success', message, options);
  }

  error(message: string, options?: ToastOptions): void {
    this.show('error', message, options);
  }

  warning(message: string, options?: ToastOptions): void {
    this.show('warning', message, options);
  }

  info(message: string, options?: ToastOptions): void {
    this.show('info', message, options);
  }

  dismiss(id: string): void {
    this.toasts.update((prev) => prev.filter((t) => t.id !== id));
  }

  private show(type: ToastType, message: string, options?: ToastOptions): void {
    const id = `toast-${++nextId}`;
    const duration = options?.duration ?? DEFAULT_DURATIONS[type];
    const toast: Toast = { id, type, message, duration };

    this.toasts.update((prev) => {
      const next = [...prev, toast];
      return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
    });

    setTimeout(() => this.dismiss(id), duration);
  }
}
