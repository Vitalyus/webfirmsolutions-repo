import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'right',
    verticalPosition: 'bottom',
    panelClass: []
  };

  /**
   * Show success toast notification
   */
  success(message: string, action: string = 'Close'): void {
    this.show(message, 'success', action);
  }

  /**
   * Show error toast notification
   */
  error(message: string, action: string = 'Close'): void {
    this.show(message, 'error', action);
  }

  /**
   * Show warning toast notification
   */
  warning(message: string, action: string = 'Close'): void {
    this.show(message, 'warning', action);
  }

  /**
   * Show info toast notification
   */
  info(message: string, action: string = 'Close'): void {
    this.show(message, 'info', action);
  }

  /**
   * Show toast with custom configuration
   */
  private show(
    message: string, 
    type: ToastType, 
    action: string = 'Close',
    duration?: number
  ): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: duration || this.defaultConfig.duration,
      panelClass: [`toast-${type}`, 'modern-toast']
    };

    this.snackBar.open(message, action, config);
  }

  /**
   * Dismiss all active toasts
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
