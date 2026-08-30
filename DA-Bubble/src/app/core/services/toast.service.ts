import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  message = signal('');

  // Shows a toast message and clears it after 1.5 seconds.
  show(message: string): void {
    this.message.set(message);
    setTimeout(() => {
      this.message.set('');
    }, 1500)
  }
}