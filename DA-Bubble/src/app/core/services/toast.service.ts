import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  message = signal('');

  show(message: string): void {
    console.log('Toast message:', message);
    this.message.set(message);
    setTimeout(() => {
      this.message.set('');
    }, 2000)
  }

}